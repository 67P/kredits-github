
module.exports = function (kredits, contributorAttr) {
  return kredits.Contributor.findByAccount({
    username: contributorAttr.github_username,
    site: 'github.com' })
  .then(contributor => {
    if(contributor) {
      return Promise.resolve(); // we already have that contributor
    } else {
      return kredits.Contributor.add(contributorAttr, {gasLimit: 400000})
        .then(transaction => {
          console.log('Contributor added', transaction.hash);
          return transaction.wait()
            .then(confirmedTx => {
              return kredits.Contributor.findByAccount({
                site: 'github.com',
                username: contributorAttr.github_username
              });
            });
        });
    }
  });
}
