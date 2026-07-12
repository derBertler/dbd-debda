'use strict';

exports.up = function(db, callback) {
  runSteps([
    function addAllowKillerBans(next) {
      db.addColumn('TOURNAMENT', 'ALLOW_KILLER_BANS', { type: 'boolean', notNull: true, defaultValue: false }, next);
    },
    function addKillerBanCount(next) {
      db.addColumn('TOURNAMENT', 'KILLER_BAN_COUNT', { type: 'int', notNull: true, defaultValue: 0 }, next);
    },
    function addAllowMapBans(next) {
      db.addColumn('TOURNAMENT', 'ALLOW_MAP_BANS', { type: 'boolean', notNull: true, defaultValue: false }, next);
    },
    function addMapBanCount(next) {
      db.addColumn('TOURNAMENT', 'MAP_BAN_COUNT', { type: 'int', notNull: true, defaultValue: 0 }, next);
    },
    function addTeamKillerBans(next) {
      db.addColumn('TOURNAMENT_TEAM', 'KILLER_BANS', { type: 'text' }, next);
    },
    function addTeamMapBans(next) {
      db.addColumn('TOURNAMENT_TEAM', 'MAP_BANS', { type: 'text' }, next);
    }
  ], callback);
};

exports.down = function(db, callback) {
  runSteps([
    function removeTeamMapBans(next) {
      db.removeColumn('TOURNAMENT_TEAM', 'MAP_BANS', next);
    },
    function removeTeamKillerBans(next) {
      db.removeColumn('TOURNAMENT_TEAM', 'KILLER_BANS', next);
    },
    function removeMapBanCount(next) {
      db.removeColumn('TOURNAMENT', 'MAP_BAN_COUNT', next);
    },
    function removeAllowMapBans(next) {
      db.removeColumn('TOURNAMENT', 'ALLOW_MAP_BANS', next);
    },
    function removeKillerBanCount(next) {
      db.removeColumn('TOURNAMENT', 'KILLER_BAN_COUNT', next);
    },
    function removeAllowKillerBans(next) {
      db.removeColumn('TOURNAMENT', 'ALLOW_KILLER_BANS', next);
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
