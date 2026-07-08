'use strict';

exports.up = function(db, callback) {
  runSteps([
    function createGameDay(next) {
      db.createTable('TOURNAMENT_GAME_DAY', {
        ID: { type: 'int', primaryKey: true, autoIncrement: true },
        VERSION: { type: 'string', length: 100, notNull: true },
        TOURNAMENT_ID: {
          type: 'int',
          notNull: true,
          foreignKey: {
            name: 'fk_tournament_game_day_tournament',
            table: 'TOURNAMENT',
            mapping: 'ID',
            rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }
          }
        },
        TITLE: { type: 'string', length: 255, notNull: true },
        GAME_DATE: { type: 'date' },
        SORT_ORDER: { type: 'int', notNull: true, defaultValue: 0 },
        CREATED_AT: { type: 'datetime', notNull: true },
        UPDATED_AT: { type: 'datetime' }
      }, next);
    },
    function createMatchup(next) {
      db.createTable('TOURNAMENT_MATCHUP', {
        ID: { type: 'int', primaryKey: true, autoIncrement: true },
        VERSION: { type: 'string', length: 100, notNull: true },
        TOURNAMENT_ID: {
          type: 'int',
          notNull: true,
          foreignKey: {
            name: 'fk_tournament_matchup_tournament',
            table: 'TOURNAMENT',
            mapping: 'ID',
            rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }
          }
        },
        GAME_DAY_ID: {
          type: 'int',
          notNull: true,
          foreignKey: {
            name: 'fk_tournament_matchup_game_day',
            table: 'TOURNAMENT_GAME_DAY',
            mapping: 'ID',
            rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }
          }
        },
        TEAM_ONE_ID: {
          type: 'int',
          foreignKey: {
            name: 'fk_tournament_matchup_team_one',
            table: 'TOURNAMENT_TEAM',
            mapping: 'ID',
            rules: { onDelete: 'SET NULL', onUpdate: 'RESTRICT' }
          }
        },
        TEAM_TWO_ID: {
          type: 'int',
          foreignKey: {
            name: 'fk_tournament_matchup_team_two',
            table: 'TOURNAMENT_TEAM',
            mapping: 'ID',
            rules: { onDelete: 'SET NULL', onUpdate: 'RESTRICT' }
          }
        },
        START_TIME: { type: 'string', length: 50 },
        TEAM_ONE_SCORE: { type: 'string', length: 50 },
        TEAM_TWO_SCORE: { type: 'string', length: 50 },
        SORT_ORDER: { type: 'int', notNull: true, defaultValue: 0 },
        CREATED_AT: { type: 'datetime', notNull: true },
        UPDATED_AT: { type: 'datetime' }
      }, next);
    }
  ], callback);
};

exports.down = function(db, callback) {
  runSteps([
    function dropMatchup(next) {
      db.dropTable('TOURNAMENT_MATCHUP', next);
    },
    function dropGameDay(next) {
      db.dropTable('TOURNAMENT_GAME_DAY', next);
    }
  ], callback);
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
