'use strict';

exports.up = function(db, callback) {
  runSteps([
    function addUserId(next) {
      db.addColumn('TOURNAMENT_PLAYER', 'USER_ID', {
        type: 'int',
        foreignKey: {
          name: 'fk_tournament_player_user',
          table: 'USER',
          mapping: 'ID',
          rules: { onDelete: 'SET NULL', onUpdate: 'RESTRICT' }
        }
      }, next);
    },
    function linkExistingPlayers(next) {
      db.runSql(
        [
          'UPDATE `TOURNAMENT_PLAYER`',
          'INNER JOIN `USER` ON `USER`.`NAME` = `TOURNAMENT_PLAYER`.`NAME`',
          'SET `TOURNAMENT_PLAYER`.`USER_ID` = `USER`.`ID`',
          'WHERE `TOURNAMENT_PLAYER`.`USER_ID` IS NULL'
        ].join(' '),
        next
      );
    }
  ], callback);
};

exports.down = function(db, callback) {
  db.removeColumn('TOURNAMENT_PLAYER', 'USER_ID', callback);
};

function runSteps(steps, callback) {
  const pending = steps.slice();

  function next(error) {
    if (error) {
      return callback(error);
    }

    const step = pending.shift();
    if (!step) {
      return callback();
    }

    step(next);
  }

  next();
}

exports._meta = {
  "version": 1
};
