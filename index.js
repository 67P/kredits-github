// Checks API example
// See: https://developer.github.com/v3/checks/ to learn more

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {

  app.on([
    'pull_request.opened',
    'pull_request.edited',
    'pull_request.labeled',
    'pull_request.unlabeled',
    'pull_request.synchronize'
  ], handlePullRequestChange)

  async function handlePullRequestChange (context) {
    const { action, pull_request: pr, repository: repo } = context.payload
    const hasKreditsLabel = !!pr.labels.find(l => l.name.match(/^kredits-\d$/))

    try { await setStatus(hasKreditsLabel, context) }
    catch (e) { console.log(e) }
  }

  function setStatus (hasKreditsLabel, context) {
    const pullRequest = context.payload.pull_request

    const checkOptions = {
      name: "Kredits",
      head_branch: '', // workaround for https://github.com/octokit/rest.js/issues/874
      head_sha: pullRequest.head.sha,
      status: 'in_progress',
      started_at: (new Date()).toISOString(),
      output: {
        title: 'Kredits label missing',
        summary: 'No kredits label assigned. Please add one for this check to pass.',
        text: 'This project rewards contributions with Kosmos Kredits. In order to determine the amount, the bot looks for a label of `kredits-1` (small contribution), `kredits-2` (medium-size contribution), or `kredits-3` (large contribution).'
      }
    }

    if (hasKreditsLabel) {
      checkOptions.status = 'completed'
      checkOptions.conclusion = 'success'
      checkOptions.completed_at = new Date()
      checkOptions.output.title = 'Kredits label assigned'
      checkOptions.output.summary = ''
    }

    return context.github.checks.create(context.repo(checkOptions))
  }

  // For more information on building apps:
  // https://probot.github.io/docs/
}
