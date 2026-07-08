'use strict';

exports.up = function(db, callback) {
  db.addIndex(
    'TOURNAMENT_ADMINS',
    'idx_tournament_admins_user_tournament_unique',
    ['USER_ID', 'TOURNAMENT_ID'],
    true,
    callback
  );
};

exports.down = function(db, callback) {
  db.removeIndex('TOURNAMENT_ADMINS', 'idx_tournament_admins_user_tournament_unique', callback);
};

exports._meta = {
  "version": 1
};
