module.exports = function (kredits, contributor, contribution) {
  const contributionAttr = Object.assign({}, contribution, {
    contributorId: contributor.id,
    contributorIpfsHash: contributor.ipfsHash,
    kind: 'dev'
  });
  return kredits.Contribution.addContribution(contributionAttr, {gasLimit: 600000})
    .then(transaction => {
      console.log(`Contribution added for contributor #${contributor.id}: ${transaction.hash}`);
      return transaction;
    });
}
