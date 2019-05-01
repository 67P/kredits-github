const addContributionFor = require('./add-contribution');
const RSVP = require('rsvp');

module.exports = function (options) {
  const { kredits, config, context, pull } = options;

  if (!pull.valid) {
    return Promise.reject(new Error(`Pull request invalid: amount=${pull.amount} claimed=${pull.claimed}`));
  }

  let contributorPromises = {};
  pull.recipients.forEach(username => {
    contributorPromises[username] = kredits.Contributor.findByAccount({ username, site: 'github.com' });
  });

  return RSVP.hash(contributorPromises).then(contributors => {
    const missingContributors = Object.keys(contributors).filter(c => contributors[c] === undefined);
    if (missingContributors.length > 0) {
      context.github.issues.createComment(context.issue({
        body: `I tried to send you ${pull.amount}${config.coinSymbol} but I am missing the contributor details of ${missingContributors.join(', ')}.
Please reply with \`/kredits [your ethereum address]\` to create a contributor profile.`
      }));
    } else {
      const addPromises = Object.values(contributors).map(c => addContributionFor(kredits, c, pull.contributionAttributes));
      Promise.all(addPromises).then(transactions => {
        context.github.issues.createComment(context.issue({
          body: `Thanks for your contribution! ${pull.amount}${config.coinSymbol} are on the way to @${Object.keys(contributors).join(', ')}.`
        }));
        if (config.claimedLabel) {
          context.github.issues.addLabels(context.issue({ labels: [config.claimedLabel] }));
        }
      });
    }
  });
};
