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

module.exports = async function (context) {
  const { action, pull_request: pr, repository: repo } = context.payload
  const hasKreditsLabel = !!pr.labels.find(l => l.name.match(/^kredits-\d$/))

  try { await setStatus(hasKreditsLabel, context) }
  catch (e) { console.log(e) }
}
