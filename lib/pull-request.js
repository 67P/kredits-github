class PullRequest {

  constructor (options) {
    this.config = options.config;
    this.repository = options.repository;
    this.data = options.data;
    this.number = this.data.number;
    this.assignees  = this.data.assignees.map(a => a.login);
    this.html_url = this.data.html_url;
    this.repoFullName = this.repository.full_name;
    this.repoName = this.repository.neme
    this.repoOwner = this.repository.owner;
    this.title = this.data.title;
    this.description = `${this.repoFullName}: ${this.title}`;

    if (this.data.merged_at) {
      let [date, time] = this.data.merged_at.split('T');
      this.date = date;
      this.time = time;
    }

    if (this.assignees.length > 0) {
      this.recipients = this.assignees;
    } else {
      this.recipients = [this.data.user.login];
    }
  }

  get valid () {
    return this.merged && !this.claimed && this.amount > 0;
  }

  get merged () {
    return this.data.merged;
  }

  get claimed () {
    return this.labels.includes(this.config.claimedLabel.toLowerCase());
  }

  get amount () {
    const amountsLabel = this.labels.filter(l => l.match(RegExp(this.config.amountLabelRegex, 'i')))[0];
    // No label, no kredits
    if (typeof amountsLabel === 'undefined') { return 0; }
    return this.config.amounts[amountsLabel];
  }

  get labels () {
    return this.data.labels.map(l => l.name.toLowerCase());
  }

  claimableBy (login) {
    return this.recipients.includes(login);
  }

  get contributionAttributes () {
    return {
      date: this.date,
      time: this.time,
      amount: this.amount,
      description: this.description,
      url: this.html_url,
      details: this.data
    };
  }

}

module.exports = PullRequest;
