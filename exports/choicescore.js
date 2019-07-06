const Datastore = require('@google-cloud/datastore');
const { name: projectId } = require('../package.json');
const datastore = new Datastore({
  projectId: projectId,
});
(async function(){
  let query = datastore
    .createQuery('Solution');
  let solution = await datastore.runQuery(query);
  solution = solution[0];
  let sol = [];
  let rule = [, , [, ], [, ], [, [1, 0.5], [1], [1, 0.5, 0.5], [1, 0.5], [1, 0.5]]];
  for(let i = 1; i <= 25; i++) {
    rule[2][i] = [1];
    rule[3][i] = [1 * 30 / 25];
  }
  rule[3][11] = [30/25,30/25,30/25,30/25,30/25];
  solution.forEach(e => {
    e.sol.forEach((el, i) => {
      sol[e.part] = sol[e.part] || [];
      sol[e.part][e.num] = sol[e.part][e.num] || [];
      sol[e.part][e.num][el] = i;
    });
  });
  query = datastore
    .createQuery('Users')
    .filter('done', '=', false);
  let users = await datastore.runQuery(query);
  // console.log(users[0].length);
  users[0].forEach((user, i) => {
    let query = datastore
      .createQuery('Answers')
      .filter('email', '=', user.email);
    datastore
      .runQuery(query)
      .then(answers => {
        let sum = [0, 0, 0, 0, 0, 0];
        answers = answers[0];
        answers.forEach(e => {
          if(sol[e.part] === undefined) return ;
          if(sol[e.part][e.num] === undefined) return ;
          if(sol[e.part][e.num][e.ans] === undefined) return ;
          sum[e.part] = +(sum[e.part]+(rule[e.part][e.num][sol[e.part][e.num][e.ans]] || 0)).toFixed(12);
        });
        return datastore.save({
          key: datastore.key('Score'),
          data: {
            email: user.email,
            choice: +(sum[0] + sum[1] + sum[2] + sum[3] + sum[4] + sum[5] + 0.001).toFixed(12)
          }
        })
        .catch(err => {
          console.error(err);
        });
      });
  });
})();