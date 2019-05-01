const RSVP = require('rsvp');
const Kredits = require('kredits-contracts');
const ethers = require('ethers');

const PullRequest = require('./lib/pull-request');
const claimPullRequest = require('./lib/claim-pull-request');
const addContributor = require('./lib/add-contributor');
const handlePullRequestChange = require('./lib/handle-pull-request-change');

const defaultConfig = require('./config/defaults');
if (!process.env.WALLET_PRIVATE_KEY) {
  console.log('Wallet could not be loaded. Please provide a WALLET_PRIVATE_KEY');
  process.exit(1);
}
const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY);

// TODO: maybe move into kredits-contracts
Kredits.for = function (connectionOptions, kreditsOptions) {
  const { network, rpcUrl, wallet } = connectionOptions;
  let ethProvider, signer;
  if (rpcUrl || network === 'local') {
    ethProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
  } else {
    ethProvider = new ethers.getDefaultProvider(network);
  }
  if (wallet) {
    signer = wallet.connect(ethProvider);
  } else if (ethProvider.getSigner) {
    signer = ethProvider.getSigner();
  }
  return new Kredits(ethProvider, signer, kreditsOptions);
}

function getConfig (context) {
  let repo = context.repo();
  return context.github.repos.getContents({
    owner: repo.owner,
    repo: repo.repo,
    path: '.github/kredits.json'
  })
  .then(configFile => {
    let content = Buffer.from(configFile.data.content, 'base64').toString();
    let config = JSON.parse(content);
    return Object.assign({}, defaultConfig, config);
  })
  .catch(e => {
    console.log('Error loading config', e.message);
    return defaultConfig;
  });
}

function getKredits (config) {
  return Kredits.for(
    { rpcUrl: config.ethRpcUrl, network: config.ethNetwork, wallet: wallet },
    {
      addresses: { Kernel: config.address },
      apm: config.apmDomain,
      ipfsConfig: config.ipfsConfig
    }
  ).init();
}

module.exports = app => {
  wallet.getAddress().then(address => {
    app.log(`Bot address: ${address}`);
  });

  app.on([
    'pull_request.opened',
    'pull_request.edited',
    'pull_request.labeled',
    'pull_request.unlabeled',
    'pull_request.synchronize'
  ], handlePullRequestChange)

  app.on(['issue_comment.created'], async (context) => {
    if (context.isBot) { return; }
    // check if kredits bot is mentioned
    const commandMatch = context.payload.comment.body.match(/^\/([\w]+)\b *(.*)?$/m);
    if (!commandMatch || commandMatch[1].toLowerCase() != 'kredits') {
      return;
    }
    const command = commandMatch[2];

    const config = await getConfig(context);
    // check if a DAO is configured
    if (!config.address) {
      console.log('No DAO address found in config');
      return;
    }
    const kredits = await getKredits(config);
    const pullRequest = await context.github.pulls.get({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      pull_number: context.payload.issue.number
    });
    const pull = new PullRequest({
      data: pullRequest.data,
      repository: context.payload.repository,
      config: config
    });

    const accountMatch = command.match(/0x[a-fA-F0-9]{40}/g)
    if (command.split(' ')[0] === 'claim') {
      claimPullRequest({ kredits, config, pull, context });
    } else if (accountMatch) {
      const account = accountMatch[0];
      const commentAuthor = await context.github.users.getByUsername({ username: context.payload.sender.login }); // get full profile
      const contributorAttr = {
        name: commentAuthor.data.name,
        github_username: commentAuthor.data.login,
        github_uid: commentAuthor.data.id,
        url: commentAuthor.data.blog || commentAuthor.data.html_url,
        kind: 'person',
        account: account
      };
      addContributor(kredits, contributorAttr).then(contributor => {
        context.github.issues.createComment(context.issue({
          body: `Great @${commentAuthor.data.login}, your profile is all set.`
        }));

        // check if we now have all profiles, and if so send the kredits
        let contributorPromises = {};
        pull.recipients.forEach(username => {
          contributorPromises[username] = kredits.Contributor.findByAccount({ username, site: 'github.com' });
        });
        RSVP.hash(contributorPromises).then(contributors => {
          const missingContributors = Object.keys(contributors).filter(c => contributors[c] === undefined);
          if (missingContributors.length === 0) {
            claimPullRequest({ kredits, config, pull, context });
          }
        });
      });
    }
  });


  app.on('pull_request.closed', async context => {
    if (!context.payload.pull_request.merged) {
      return true;
    }
    const config = await getConfig(context);
    if (!config.address) {
      console.log('No DAO address found in config');
      return;
    }
    const kredits = await getKredits(config);

    const pull = new PullRequest({
      data: context.payload.pull_request,
      repository: context.payload.repository,
      config: config,
    });
    claimPullRequest({ kredits, config, pull, context });
  });
};
