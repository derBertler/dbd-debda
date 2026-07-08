'use strict';

var dbm;
var type;
var seed;

exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db, callback) {
  runSteps([
    function createUser(next) {
      db.createTable('USER', {
        ID: { type: 'int', primaryKey: true, autoIncrement: true },
        NAME: { type: 'string', length: 100, notNull: true, unique: true },
        PASSWORD: { type: 'string', length: 255, notNull: true },
        EMAIL: { type: 'string', length: 100, unique: true },
        CREATED_AT: { type: 'datetime', notNull: true },
        UPDATED_AT: { type: 'datetime' }
      }, next);
    },
    function createTournament(next) {
      db.createTable('TOURNAMENT', {
        ID: { type: 'int', primaryKey: true, autoIncrement: true },
        VERSION: { type: 'string', length: 100, notNull: true },
        NAME: { type: 'string', length: 255, notNull: true },
        CREATED_AT: { type: 'datetime', notNull: true },
        UPDATED_AT: { type: 'datetime' }
      }, next);
    },
    function createTournamentAdmins(next) {
      db.createTable('TOURNAMENT_ADMINS', {
        ID: { type: 'int', primaryKey: true, autoIncrement: true },
        VERSION: { type: 'string', length: 100, notNull: true },
        USER_ID: {
          type: 'int',
          notNull: true,
          foreignKey: {
            name: 'fk_tournament_admins_user',
            table: 'USER',
            mapping: 'ID',
            rules: { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' }
          }
        },
        TOURNAMENT_ID: {
          type: 'int',
          notNull: true,
          foreignKey: {
            name: 'fk_tournament_admins_tournament',
            table: 'TOURNAMENT',
            mapping: 'ID',
            rules: { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' }
          }
        },
        CREATED_AT: { type: 'datetime', notNull: true },
        UPDATED_AT: { type: 'datetime' }
      }, next);
    },
    function createTournamentTeam(next) {
      db.createTable('TOURNAMENT_TEAM', {
        ID: { type: 'int', primaryKey: true, autoIncrement: true },
        VERSION: { type: 'string', length: 100, notNull: true },
        TOURNAMENT_ID: {
          type: 'int',
          notNull: true,
          foreignKey: {
            name: 'fk_tournament_team_tournament',
            table: 'TOURNAMENT',
            mapping: 'ID',
            rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }
          }
        },
        NAME: { type: 'string', length: 255, notNull: true },
        SHORTHAND: { type: 'string', length: 32 },
        SORT_ORDER: { type: 'int', notNull: true, defaultValue: 0 },
        CREATED_AT: { type: 'datetime', notNull: true },
        UPDATED_AT: { type: 'datetime' }
      }, next);
    },
    function createTournamentPlayer(next) {
      db.createTable('TOURNAMENT_PLAYER', {
        ID: { type: 'int', primaryKey: true, autoIncrement: true },
        VERSION: { type: 'string', length: 100, notNull: true },
        TOURNAMENT_ID: {
          type: 'int',
          notNull: true,
          foreignKey: {
            name: 'fk_tournament_player_tournament',
            table: 'TOURNAMENT',
            mapping: 'ID',
            rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }
          }
        },
        TEAM_ID: {
          type: 'int',
          foreignKey: {
            name: 'fk_tournament_player_team',
            table: 'TOURNAMENT_TEAM',
            mapping: 'ID',
            rules: { onDelete: 'SET NULL', onUpdate: 'RESTRICT' }
          }
        },
        NAME: { type: 'string', length: 255, notNull: true },
        STEAM_ID: { type: 'string', length: 32 },
        PLAYER_ROLE: { type: 'string', length: 50, notNull: true, defaultValue: 'player' },
        IS_TEAM_LEADER: { type: 'boolean', notNull: true, defaultValue: false },
        SORT_ORDER: { type: 'int', notNull: true, defaultValue: 0 },
        CREATED_AT: { type: 'datetime', notNull: true },
        UPDATED_AT: { type: 'datetime' }
      }, next);
    },
    function createRuleCategory(next) {
      db.createTable('RULE_CATEGORY', {
        ID: { type: 'int', primaryKey: true, autoIncrement: true },
        VERSION: { type: 'string', length: 100, notNull: true },
        TOURNAMENT_ID: {
          type: 'int',
          notNull: true,
          foreignKey: {
            name: 'fk_rule_category_tournament',
            table: 'TOURNAMENT',
            mapping: 'ID',
            rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }
          }
        },
        TITLE: { type: 'string', length: 255, notNull: true },
        SORT_ORDER: { type: 'int', notNull: true, defaultValue: 0 },
        CREATED_AT: { type: 'datetime', notNull: true },
        UPDATED_AT: { type: 'datetime' }
      }, next);
    },
    function createRuleItem(next) {
      db.createTable('RULE_ITEM', {
        ID: { type: 'int', primaryKey: true, autoIncrement: true },
        VERSION: { type: 'string', length: 100, notNull: true },
        RULE_CATEGORY_ID: {
          type: 'int',
          notNull: true,
          foreignKey: {
            name: 'fk_rule_item_category',
            table: 'RULE_CATEGORY',
            mapping: 'ID',
            rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }
          }
        },
        HEADING: { type: 'string', length: 255 },
        BODY: { type: 'text' },
        POINT_VALUE: { type: 'string', length: 50 },
        MAX_VALUE: { type: 'string', length: 100 },
        ITEM_TYPE: { type: 'string', length: 50, notNull: true, defaultValue: 'text' },
        SORT_ORDER: { type: 'int', notNull: true, defaultValue: 0 },
        CREATED_AT: { type: 'datetime', notNull: true },
        UPDATED_AT: { type: 'datetime' }
      }, next);
    },
    function createStaffCategory(next) {
      db.createTable('STAFF_CATEGORY', {
        ID: { type: 'int', primaryKey: true, autoIncrement: true },
        VERSION: { type: 'string', length: 100, notNull: true },
        TOURNAMENT_ID: {
          type: 'int',
          notNull: true,
          foreignKey: {
            name: 'fk_staff_category_tournament',
            table: 'TOURNAMENT',
            mapping: 'ID',
            rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }
          }
        },
        TITLE: { type: 'string', length: 255, notNull: true },
        SORT_ORDER: { type: 'int', notNull: true, defaultValue: 0 },
        CREATED_AT: { type: 'datetime', notNull: true },
        UPDATED_AT: { type: 'datetime' }
      }, next);
    },
    function createStaffMember(next) {
      db.createTable('STAFF_MEMBER', {
        ID: { type: 'int', primaryKey: true, autoIncrement: true },
        VERSION: { type: 'string', length: 100, notNull: true },
        STAFF_CATEGORY_ID: {
          type: 'int',
          notNull: true,
          foreignKey: {
            name: 'fk_staff_member_category',
            table: 'STAFF_CATEGORY',
            mapping: 'ID',
            rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT' }
          }
        },
        NAME: { type: 'string', length: 255, notNull: true },
        SOCIAL_LABEL: { type: 'string', length: 100 },
        SOCIAL_URL: { type: 'string', length: 500 },
        SORT_ORDER: { type: 'int', notNull: true, defaultValue: 0 },
        CREATED_AT: { type: 'datetime', notNull: true },
        UPDATED_AT: { type: 'datetime' }
      }, next);
    }
  ], callback);
};

exports.down = function(db, callback) {
  runSteps([
    function dropStaffMember(next) {
      db.dropTable('STAFF_MEMBER', next);
    },
    function dropStaffCategory(next) {
      db.dropTable('STAFF_CATEGORY', next);
    },
    function dropRuleItem(next) {
      db.dropTable('RULE_ITEM', next);
    },
    function dropRuleCategory(next) {
      db.dropTable('RULE_CATEGORY', next);
    },
    function dropTournamentPlayer(next) {
      db.dropTable('TOURNAMENT_PLAYER', next);
    },
    function dropTournamentTeam(next) {
      db.dropTable('TOURNAMENT_TEAM', next);
    },
    function dropTournamentAdmins(next) {
      db.dropTable('TOURNAMENT_ADMINS', next);
    },
    function dropTournament(next) {
      db.dropTable('TOURNAMENT', next);
    },
    function dropUser(next) {
      db.dropTable('USER', next);
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
