'use strict';

exports.up = function(db, callback) {
  runSteps([
    function addDescription(next) {
      db.addColumn('TOURNAMENT', 'DESCRIPTION', { type: 'text' }, next);
    },
    function addStartsAt(next) {
      db.addColumn('TOURNAMENT', 'STARTS_AT', { type: 'date' }, next);
    },
    function addEndsAt(next) {
      db.addColumn('TOURNAMENT', 'ENDS_AT', { type: 'date' }, next);
    },
    function addScoringMode(next) {
      db.addColumn('TOURNAMENT', 'SCORING_MODE', { type: 'string', length: 32, notNull: true, defaultValue: 'points' }, next);
    },
    function addGamesPerMatch(next) {
      db.addColumn('TOURNAMENT', 'GAMES_PER_MATCH', { type: 'int', notNull: true, defaultValue: 2 }, next);
    },
    function createScoringCategory(next) {
      db.createTable('SCORING_CATEGORY', {
        ID: { type: 'int', primaryKey: true, autoIncrement: true },
        VERSION: { type: 'string', length: 100, notNull: true },
        TOURNAMENT_ID: {
          type: 'int',
          notNull: true,
          foreignKey: {
            name: 'fk_scoring_category_tournament',
            table: 'TOURNAMENT',
            mapping: 'ID',
            rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }
          }
        },
        DISPLAY_NAME: { type: 'string', length: 255, notNull: true },
        POINTS_PER_OCCURRENCE: { type: 'decimal', precision: 10, scale: 2, notNull: true, defaultValue: 0 },
        MAX_OCCURRENCES: { type: 'int', notNull: true, defaultValue: 0 },
        ACTUAL_OCCURRENCES: { type: 'int', notNull: true, defaultValue: 0 },
        SORT_ORDER: { type: 'int', notNull: true, defaultValue: 0 },
        CREATED_AT: { type: 'datetime', notNull: true },
        UPDATED_AT: { type: 'datetime' }
      }, next);
    }
  ], callback);
};

exports.down = function(db, callback) {
  runSteps([
    function dropScoringCategory(next) {
      db.dropTable('SCORING_CATEGORY', next);
    },
    function removeGamesPerMatch(next) {
      db.removeColumn('TOURNAMENT', 'GAMES_PER_MATCH', next);
    },
    function removeScoringMode(next) {
      db.removeColumn('TOURNAMENT', 'SCORING_MODE', next);
    },
    function removeEndsAt(next) {
      db.removeColumn('TOURNAMENT', 'ENDS_AT', next);
    },
    function removeStartsAt(next) {
      db.removeColumn('TOURNAMENT', 'STARTS_AT', next);
    },
    function removeDescription(next) {
      db.removeColumn('TOURNAMENT', 'DESCRIPTION', next);
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
