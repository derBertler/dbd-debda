'use strict';

exports.up = function(db, callback) {
  db.createTable('TOURNAMENT_MATCHUP_SCORE', {
    ID: { type: 'int', primaryKey: true, autoIncrement: true },
    VERSION: { type: 'string', length: 100, notNull: true },
    TOURNAMENT_ID: {
      type: 'int',
      notNull: true,
      foreignKey: {
        name: 'fk_matchup_score_tournament',
        table: 'TOURNAMENT',
        mapping: 'ID',
        rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }
      }
    },
    MATCHUP_ID: {
      type: 'int',
      notNull: true,
      foreignKey: {
        name: 'fk_matchup_score_matchup',
        table: 'TOURNAMENT_MATCHUP',
        mapping: 'ID',
        rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }
      }
    },
    GAME_NUMBER: { type: 'int', notNull: true },
    SCORING_CATEGORY_ID: {
      type: 'int',
      notNull: true,
      foreignKey: {
        name: 'fk_matchup_score_category',
        table: 'SCORING_CATEGORY',
        mapping: 'ID',
        rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }
      }
    },
    TEAM_ID: {
      type: 'int',
      notNull: true,
      foreignKey: {
        name: 'fk_matchup_score_team',
        table: 'TOURNAMENT_TEAM',
        mapping: 'ID',
        rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }
      }
    },
    OCCURRENCES: { type: 'decimal', precision: 10, scale: 2, notNull: true, defaultValue: 0 },
    CREATED_AT: { type: 'datetime', notNull: true },
    UPDATED_AT: { type: 'datetime' }
  }, callback);
};

exports.down = function(db, callback) {
  db.dropTable('TOURNAMENT_MATCHUP_SCORE', callback);
};

exports._meta = {
  "version": 1
};
