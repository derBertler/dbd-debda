const express = require('express');
const db = require('../db');

module.exports = function createIndexRouter() {
  const router = express.Router();

  router.get('/', function renderHome(req, res) {
    res.render('pages/index', {
      title: 'Debda Tournament',
      activePage: 'home'
    });
  });

  router.get(['/my-tournaments', '/tournaments'], requireLogin, async function renderMyTournaments(req, res, next) {
    try {
      const createdTournaments = await getCreatedTournaments(req.currentUser.id);
      const participantTournaments = await getParticipantTournaments(req.currentUser.id);

      res.render('pages/myTournaments', {
        title: 'My Tournaments',
        activePage: 'my-tournaments',
        createdTournaments,
        participantTournaments
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/tournaments/create', requireLogin, function renderCreateTournament(req, res) {
    res.render('pages/tournamentCreate', {
      title: 'Create Tournament',
      activePage: 'create-tournament',
      form: createDefaultTournamentForm(),
      message: null
    });
  });

  router.post('/tournaments/create', requireLogin, async function handleCreateTournament(req, res, next) {
    const form = normalizeTournamentForm(req.body);

    if (!form.name) {
      return res.status(400).render('pages/tournamentCreate', {
        title: 'Create Tournament',
        activePage: 'create-tournament',
        form,
        message: {
          type: 'danger',
          text: 'Tournament name is required.'
        }
      });
    }

    let connection;

    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      const [tournamentResult] = await connection.execute(
        [
          'INSERT INTO `TOURNAMENT`',
          '(`VERSION`, `NAME`, `DESCRIPTION`, `STARTS_AT`, `ENDS_AT`, `SCORING_MODE`, `GAMES_PER_MATCH`, `ALLOW_KILLER_BANS`, `KILLER_BAN_COUNT`, `ALLOW_MAP_BANS`, `MAP_BAN_COUNT`, `CREATED_AT`)',
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())'
        ].join(' '),
        [
          '1',
          form.name,
          form.description || null,
          form.startsAt || null,
          form.endsAt || null,
          form.scoringMode,
          form.gamesPerMatch,
          form.allowKillerBans,
          form.killerBanCount,
          form.allowMapBans,
          form.mapBanCount
        ]
      );
      const tournamentId = tournamentResult.insertId;

      await connection.execute(
        'INSERT INTO `TOURNAMENT_ADMINS` (`VERSION`, `USER_ID`, `TOURNAMENT_ID`, `CREATED_AT`) VALUES (?, ?, ?, NOW())',
        ['1', req.currentUser.id, tournamentId]
      );

      for (const [index, category] of form.scoringCategories.entries()) {
        if (!category.displayName) {
          continue;
        }

        await connection.execute(
          [
            'INSERT INTO `SCORING_CATEGORY`',
            '(`VERSION`, `TOURNAMENT_ID`, `DISPLAY_NAME`, `POINTS_PER_OCCURRENCE`, `MAX_OCCURRENCES`, `ACTUAL_OCCURRENCES`, `SORT_ORDER`, `CREATED_AT`)',
            'VALUES (?, ?, ?, ?, ?, ?, ?, NOW())'
          ].join(' '),
          [
            '1',
            tournamentId,
            category.displayName,
            category.pointsPerOccurrence,
            category.maxOccurrences,
            category.actualOccurrences,
            index
          ]
        );
      }

      for (const [index, title] of getRuleCategoriesForTournament(form).entries()) {
        await connection.execute(
          'INSERT INTO `RULE_CATEGORY` (`VERSION`, `TOURNAMENT_ID`, `TITLE`, `SORT_ORDER`, `CREATED_AT`) VALUES (?, ?, ?, ?, NOW())',
          ['1', tournamentId, title, index]
        );
      }

      for (const [index, title] of getStaffCategoriesForTournament(form).entries()) {
        await connection.execute(
          'INSERT INTO `STAFF_CATEGORY` (`VERSION`, `TOURNAMENT_ID`, `TITLE`, `SORT_ORDER`, `CREATED_AT`) VALUES (?, ?, ?, ?, NOW())',
          ['1', tournamentId, title, index]
        );
      }

      if (form.teamSlotCount > 0) {
        for (let index = 0; index < form.teamSlotCount; index += 1) {
          await connection.execute(
            'INSERT INTO `TOURNAMENT_TEAM` (`VERSION`, `TOURNAMENT_ID`, `NAME`, `SHORTHAND`, `SORT_ORDER`, `CREATED_AT`) VALUES (?, ?, ?, ?, ?, NOW())',
            ['1', tournamentId, `Team ${index + 1}`, `T${index + 1}`, index]
          );
        }
      }

      await connection.commit();

      res.redirect(`/tournaments/${tournamentId}`);
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }

      next(error);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });

  router.post('/tournaments/:id/teams', requireLogin, requireTournamentAdmin, async function addTournamentTeam(req, res, next) {
    try {
      const banConfig = await getTournamentBanConfig(req.tournamentId);
      const team = normalizeTeamForm(req.body, banConfig);

      if (!team.name) {
        return res.redirect(`/tournaments/${req.tournamentId}#teams`);
      }

      const [[sortOrder]] = await db.execute(
        'SELECT COALESCE(MAX(`SORT_ORDER`), -1) + 1 AS nextSortOrder FROM `TOURNAMENT_TEAM` WHERE `TOURNAMENT_ID` = ?',
        [req.tournamentId]
      );

      const [result] = await db.execute(
        'INSERT INTO `TOURNAMENT_TEAM` (`VERSION`, `TOURNAMENT_ID`, `NAME`, `SHORTHAND`, `KILLER_BANS`, `MAP_BANS`, `SORT_ORDER`, `CREATED_AT`) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        ['1', req.tournamentId, team.name, team.shorthand || null, team.killerBansJson, team.mapBansJson, sortOrder.nextSortOrder]
      );

      res.redirect(getTeamRedirectPath(req.tournamentId, result.insertId));
    } catch (error) {
      next(error);
    }
  });

  router.post('/tournaments/:id/admins', requireLogin, requireTournamentAdmin, async function addTournamentAdmin(req, res, next) {
    try {
      const username = normalizeText(req.body.username);

      if (!username) {
        return res.redirect('/tournaments/' + req.tournamentId + '#organizers');
      }

      const [users] = await db.execute(
        'SELECT `ID` FROM `USER` WHERE `NAME` = ? LIMIT 1',
        [username]
      );
      const user = users[0];

      if (!user) {
        return res.redirect('/tournaments/' + req.tournamentId + '#organizers');
      }

      await db.execute(
        [
          'INSERT INTO `TOURNAMENT_ADMINS` (`VERSION`, `USER_ID`, `TOURNAMENT_ID`, `CREATED_AT`)',
          'SELECT ?, ?, ?, NOW()',
          'WHERE NOT EXISTS (',
          'SELECT 1 FROM `TOURNAMENT_ADMINS` WHERE `USER_ID` = ? AND `TOURNAMENT_ID` = ?',
          ')'
        ].join(' '),
        ['1', user.ID, req.tournamentId, user.ID, req.tournamentId]
      );

      res.redirect('/tournaments/' + req.tournamentId + '#organizers');
    } catch (error) {
      next(error);
    }
  });

  router.post('/tournaments/:id/ban-config', requireLogin, requireTournamentAdmin, async function updateTournamentBanConfig(req, res, next) {
    const banConfig = normalizeBanConfigForm(req.body);
    let connection;

    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      await connection.execute(
        [
          'UPDATE `TOURNAMENT`',
          'SET `ALLOW_KILLER_BANS` = ?, `KILLER_BAN_COUNT` = ?, `ALLOW_MAP_BANS` = ?, `MAP_BAN_COUNT` = ?, `UPDATED_AT` = NOW()',
          'WHERE `ID` = ?'
        ].join(' '),
        [
          banConfig.allowKillerBans,
          banConfig.killerBanCount,
          banConfig.allowMapBans,
          banConfig.mapBanCount,
          req.tournamentId
        ]
      );

      const [teams] = await connection.execute(
        'SELECT `ID`, `KILLER_BANS`, `MAP_BANS` FROM `TOURNAMENT_TEAM` WHERE `TOURNAMENT_ID` = ?',
        [req.tournamentId]
      );

      for (const team of teams) {
        const killerBans = banConfig.allowKillerBans
          ? normalizeBanList(parseBanList(team.KILLER_BANS), banConfig.killerBanCount)
          : [];
        const mapBans = banConfig.allowMapBans
          ? normalizeBanList(parseBanList(team.MAP_BANS), banConfig.mapBanCount)
          : [];

        await connection.execute(
          'UPDATE `TOURNAMENT_TEAM` SET `KILLER_BANS` = ?, `MAP_BANS` = ?, `UPDATED_AT` = NOW() WHERE `ID` = ? AND `TOURNAMENT_ID` = ?',
          [stringifyBanList(killerBans), stringifyBanList(mapBans), team.ID, req.tournamentId]
        );
      }

      await connection.commit();
      res.redirect('/tournaments/' + req.tournamentId + '#ban-config');
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }

      next(error);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });

  router.post('/tournaments/:id/teams/:teamId', requireLogin, requireTournamentAdmin, async function updateTournamentTeam(req, res, next) {
    try {
      const teamId = normalizeInteger(req.params.teamId, 0, 1);
      const banConfig = await getTournamentBanConfig(req.tournamentId);
      const team = normalizeTeamForm(req.body, banConfig);

      if (!teamId || !team.name) {
        return res.redirect(getTeamRedirectPath(req.tournamentId, teamId, req.body.returnTo));
      }

      const [result] = await db.execute(
        [
          'UPDATE `TOURNAMENT_TEAM`',
          'SET `NAME` = ?, `SHORTHAND` = ?, `KILLER_BANS` = ?, `MAP_BANS` = ?, `UPDATED_AT` = NOW()',
          'WHERE `ID` = ? AND `TOURNAMENT_ID` = ?'
        ].join(' '),
        [team.name, team.shorthand || null, team.killerBansJson, team.mapBansJson, teamId, req.tournamentId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).render('error', {
          message: 'Team not found.',
          error: { status: 404 }
        });
      }

      res.redirect(getTeamRedirectPath(req.tournamentId, teamId, req.body.returnTo));
    } catch (error) {
      next(error);
    }
  });

  router.post('/tournaments/:id/teams/:teamId/players', requireLogin, requireTournamentAdmin, async function addTournamentPlayer(req, res, next) {
    const teamId = normalizeInteger(req.params.teamId, 0, 1);
    const player = normalizePlayerForm(req.body);
    let connection;

    if (!teamId || !player.name) {
      return res.redirect(getTeamRedirectPath(req.tournamentId, teamId, req.body.returnTo));
    }

    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      const [teams] = await connection.execute(
        'SELECT `ID` FROM `TOURNAMENT_TEAM` WHERE `ID` = ? AND `TOURNAMENT_ID` = ? LIMIT 1',
        [teamId, req.tournamentId]
      );

      if (!teams.length) {
        await connection.rollback();
        return res.status(404).render('error', {
          message: 'Team not found.',
          error: { status: 404 }
        });
      }

      if (player.isTeamLeader) {
        await connection.execute(
          'UPDATE `TOURNAMENT_PLAYER` SET `IS_TEAM_LEADER` = FALSE, `UPDATED_AT` = NOW() WHERE `TEAM_ID` = ? AND `TOURNAMENT_ID` = ?',
          [teamId, req.tournamentId]
        );
      }

      const [[sortOrder]] = await connection.execute(
        'SELECT COALESCE(MAX(`SORT_ORDER`), -1) + 1 AS nextSortOrder FROM `TOURNAMENT_PLAYER` WHERE `TEAM_ID` = ? AND `TOURNAMENT_ID` = ?',
        [teamId, req.tournamentId]
      );
      const userId = await findUserIdByName(connection, player.name);

      await connection.execute(
        [
          'INSERT INTO `TOURNAMENT_PLAYER`',
          '(`VERSION`, `TOURNAMENT_ID`, `TEAM_ID`, `USER_ID`, `NAME`, `STEAM_ID`, `PLAYER_ROLE`, `IS_TEAM_LEADER`, `SORT_ORDER`, `CREATED_AT`)',
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())'
        ].join(' '),
        [
          '1',
          req.tournamentId,
          teamId,
          userId,
          player.name,
          player.steamId || null,
          player.playerRole,
          player.isTeamLeader,
          sortOrder.nextSortOrder
        ]
      );

      await connection.commit();
      res.redirect(getTeamRedirectPath(req.tournamentId, teamId, req.body.returnTo));
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }

      next(error);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });

  router.post('/tournaments/:id/teams/:teamId/players/:playerId', requireLogin, requireTournamentAdmin, async function updateTournamentPlayer(req, res, next) {
    const teamId = normalizeInteger(req.params.teamId, 0, 1);
    const playerId = normalizeInteger(req.params.playerId, 0, 1);
    const player = normalizePlayerForm(req.body);
    let connection;

    if (!teamId || !playerId || !player.name) {
      return res.redirect(getTeamRedirectPath(req.tournamentId, teamId, req.body.returnTo));
    }

    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      if (player.isTeamLeader) {
        await connection.execute(
          'UPDATE `TOURNAMENT_PLAYER` SET `IS_TEAM_LEADER` = FALSE, `UPDATED_AT` = NOW() WHERE `TEAM_ID` = ? AND `TOURNAMENT_ID` = ? AND `ID` <> ?',
          [teamId, req.tournamentId, playerId]
        );
      }

      const [result] = await connection.execute(
        [
          'UPDATE `TOURNAMENT_PLAYER`',
          'SET `USER_ID` = ?, `NAME` = ?, `STEAM_ID` = ?, `PLAYER_ROLE` = ?, `IS_TEAM_LEADER` = ?, `UPDATED_AT` = NOW()',
          'WHERE `ID` = ? AND `TEAM_ID` = ? AND `TOURNAMENT_ID` = ?'
        ].join(' '),
        [
          await findUserIdByName(connection, player.name),
          player.name,
          player.steamId || null,
          player.playerRole,
          player.isTeamLeader,
          playerId,
          teamId,
          req.tournamentId
        ]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).render('error', {
          message: 'Player not found.',
          error: { status: 404 }
        });
      }

      await connection.commit();
      res.redirect(getTeamRedirectPath(req.tournamentId, teamId, req.body.returnTo));
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }

      next(error);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });

  router.post('/tournaments/:id/game-days', requireLogin, requireTournamentAdmin, async function addGameDay(req, res, next) {
    try {
      const gameDay = normalizeGameDayForm(req.body);

      if (!gameDay.title) {
        return res.redirect(`/tournaments/${req.tournamentId}#game-days`);
      }

      const [[sortOrder]] = await db.execute(
        'SELECT COALESCE(MAX(`SORT_ORDER`), -1) + 1 AS nextSortOrder FROM `TOURNAMENT_GAME_DAY` WHERE `TOURNAMENT_ID` = ?',
        [req.tournamentId]
      );

      const [result] = await db.execute(
        [
          'INSERT INTO `TOURNAMENT_GAME_DAY`',
          '(`VERSION`, `TOURNAMENT_ID`, `TITLE`, `GAME_DATE`, `SORT_ORDER`, `CREATED_AT`)',
          'VALUES (?, ?, ?, ?, ?, NOW())'
        ].join(' '),
        ['1', req.tournamentId, gameDay.title, gameDay.gameDate || null, sortOrder.nextSortOrder]
      );

      res.redirect(getGameDayRedirectPath(req.tournamentId, result.insertId));
    } catch (error) {
      next(error);
    }
  });

  router.post('/tournaments/:id/game-days/:gameDayId/matchups', requireLogin, requireTournamentAdmin, async function addMatchup(req, res, next) {
    try {
      const gameDayId = normalizeInteger(req.params.gameDayId, 0, 1);
      const matchup = normalizeMatchupForm(req.body);

      if (!gameDayId) {
        return res.redirect('/tournaments/' + req.tournamentId + '#game-days');
      }

      const valid = await gameDayBelongsToTournament(gameDayId, req.tournamentId);
      if (!valid) {
        return res.status(404).render('error', {
          message: 'Game day not found.',
          error: { status: 404 }
        });
      }

      const [[sortOrder]] = await db.execute(
        'SELECT COALESCE(MAX(`SORT_ORDER`), -1) + 1 AS nextSortOrder FROM `TOURNAMENT_MATCHUP` WHERE `GAME_DAY_ID` = ? AND `TOURNAMENT_ID` = ?',
        [gameDayId, req.tournamentId]
      );

      await db.execute(
        [
          'INSERT INTO `TOURNAMENT_MATCHUP`',
          '(`VERSION`, `TOURNAMENT_ID`, `GAME_DAY_ID`, `TEAM_ONE_ID`, `TEAM_TWO_ID`, `SORT_ORDER`, `CREATED_AT`)',
          'VALUES (?, ?, ?, ?, ?, ?, NOW())'
        ].join(' '),
        [
          '1',
          req.tournamentId,
          gameDayId,
          matchup.teamOneId || null,
          matchup.teamTwoId || null,
          sortOrder.nextSortOrder
        ]
      );

      res.redirect(getGameDayRedirectPath(req.tournamentId, gameDayId, req.body.returnTo));
    } catch (error) {
      next(error);
    }
  });

  router.post('/tournaments/:id/game-days/:gameDayId/matchups/:matchupId', requireLogin, requireTournamentAdmin, async function updateMatchup(req, res, next) {
    try {
      const gameDayId = normalizeInteger(req.params.gameDayId, 0, 1);
      const matchupId = normalizeInteger(req.params.matchupId, 0, 1);
      const matchup = normalizeMatchupForm(req.body);

      if (!gameDayId || !matchupId) {
        return res.redirect('/tournaments/' + req.tournamentId + '#game-days');
      }

      const [result] = await db.execute(
        [
          'UPDATE `TOURNAMENT_MATCHUP`',
          'SET `TEAM_ONE_ID` = ?, `TEAM_TWO_ID` = ?, `UPDATED_AT` = NOW()',
          'WHERE `ID` = ? AND `GAME_DAY_ID` = ? AND `TOURNAMENT_ID` = ?'
        ].join(' '),
        [
          matchup.teamOneId || null,
          matchup.teamTwoId || null,
          matchupId,
          gameDayId,
          req.tournamentId
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).render('error', {
          message: 'Matchup not found.',
          error: { status: 404 }
        });
      }

      res.redirect(getGameDayRedirectPath(req.tournamentId, gameDayId, req.body.returnTo));
    } catch (error) {
      next(error);
    }
  });

  router.post('/tournaments/:id/game-days/:gameDayId/matchups/:matchupId/scores', requireLogin, requireTournamentAdmin, async function updateMatchupScores(req, res, next) {
    const gameDayId = normalizeInteger(req.params.gameDayId, 0, 1);
    const matchupId = normalizeInteger(req.params.matchupId, 0, 1);
    let connection;

    if (!gameDayId || !matchupId) {
      return res.redirect('/tournaments/' + req.tournamentId + '#game-days');
    }

    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      const [[matchup]] = await connection.execute(
        [
          'SELECT',
          '`TOURNAMENT_MATCHUP`.`ID`,',
          '`TOURNAMENT_MATCHUP`.`TEAM_ONE_ID`,',
          '`TOURNAMENT_MATCHUP`.`TEAM_TWO_ID`,',
          '`TOURNAMENT`.`GAMES_PER_MATCH`',
          'FROM `TOURNAMENT_MATCHUP`',
          'INNER JOIN `TOURNAMENT` ON `TOURNAMENT`.`ID` = `TOURNAMENT_MATCHUP`.`TOURNAMENT_ID`',
          'WHERE `TOURNAMENT_MATCHUP`.`ID` = ?',
          'AND `TOURNAMENT_MATCHUP`.`GAME_DAY_ID` = ?',
          'AND `TOURNAMENT_MATCHUP`.`TOURNAMENT_ID` = ?',
          'LIMIT 1'
        ].join(' '),
        [matchupId, gameDayId, req.tournamentId]
      );

      if (!matchup) {
        await connection.rollback();
        return res.status(404).render('error', {
          message: 'Matchup not found.',
          error: { status: 404 }
        });
      }

      const [categories] = await connection.execute(
        [
          'SELECT `ID`, `MAX_OCCURRENCES`',
          'FROM `SCORING_CATEGORY`',
          'WHERE `TOURNAMENT_ID` = ?',
          'ORDER BY `SORT_ORDER`, `ID`'
        ].join(' '),
        [req.tournamentId]
      );
      const entries = normalizeMatchupScoreEntries(req.body, matchup, categories);

      await connection.execute(
        'DELETE FROM `TOURNAMENT_MATCHUP_SCORE` WHERE `MATCHUP_ID` = ? AND `TOURNAMENT_ID` = ?',
        [matchupId, req.tournamentId]
      );

      if (entries.length) {
        const placeholders = entries.map(() => '(?, ?, ?, ?, ?, ?, ?, NOW())').join(', ');
        const values = entries.flatMap((entry) => [
          '1',
          req.tournamentId,
          matchupId,
          entry.gameNumber,
          entry.categoryId,
          entry.teamId,
          entry.occurrences
        ]);

        await connection.execute(
          [
            'INSERT INTO `TOURNAMENT_MATCHUP_SCORE`',
            '(`VERSION`, `TOURNAMENT_ID`, `MATCHUP_ID`, `GAME_NUMBER`, `SCORING_CATEGORY_ID`, `TEAM_ID`, `OCCURRENCES`, `CREATED_AT`)',
            'VALUES ' + placeholders
          ].join(' '),
          values
        );
      }

      await connection.commit();
      res.redirect(getGameDayRedirectPath(req.tournamentId, gameDayId, req.body.returnTo));
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }

      next(error);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });

  router.post('/tournaments/:id/scoring-categories', requireLogin, requireTournamentAdmin, async function addScoringCategory(req, res, next) {
    try {
      const category = normalizeScoringCategoryForm(req.body);

      if (!category.displayName) {
        return res.redirect('/tournaments/' + req.tournamentId + '#scoring');
      }

      const [[sortOrder]] = await db.execute(
        'SELECT COALESCE(MAX(`SORT_ORDER`), -1) + 1 AS nextSortOrder FROM `SCORING_CATEGORY` WHERE `TOURNAMENT_ID` = ?',
        [req.tournamentId]
      );

      await db.execute(
        [
          'INSERT INTO `SCORING_CATEGORY`',
          '(`VERSION`, `TOURNAMENT_ID`, `DISPLAY_NAME`, `POINTS_PER_OCCURRENCE`, `MAX_OCCURRENCES`, `ACTUAL_OCCURRENCES`, `SORT_ORDER`, `CREATED_AT`)',
          'VALUES (?, ?, ?, ?, ?, ?, ?, NOW())'
        ].join(' '),
        [
          '1',
          req.tournamentId,
          category.displayName,
          category.pointsPerOccurrence,
          category.maxOccurrences,
          category.actualOccurrences,
          sortOrder.nextSortOrder
        ]
      );

      res.redirect('/tournaments/' + req.tournamentId + '#scoring');
    } catch (error) {
      next(error);
    }
  });

  router.post('/tournaments/:id/scoring-categories/:categoryId', requireLogin, requireTournamentAdmin, async function updateScoringCategory(req, res, next) {
    try {
      const categoryId = normalizeInteger(req.params.categoryId, 0, 1);
      const category = normalizeScoringCategoryForm(req.body);

      if (!categoryId || !category.displayName) {
        return res.redirect('/tournaments/' + req.tournamentId + '#scoring');
      }

      const [result] = await db.execute(
        [
          'UPDATE `SCORING_CATEGORY`',
          'SET `DISPLAY_NAME` = ?, `POINTS_PER_OCCURRENCE` = ?, `MAX_OCCURRENCES` = ?, `UPDATED_AT` = NOW()',
          'WHERE `ID` = ? AND `TOURNAMENT_ID` = ?'
        ].join(' '),
        [
          category.displayName,
          category.pointsPerOccurrence,
          category.maxOccurrences,
          categoryId,
          req.tournamentId
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).render('error', {
          message: 'Scoring category not found.',
          error: { status: 404 }
        });
      }

      res.redirect('/tournaments/' + req.tournamentId + '#scoring');
    } catch (error) {
      next(error);
    }
  });

  router.post('/tournaments/:id/rule-categories', requireLogin, requireTournamentAdmin, async function addRuleCategory(req, res, next) {
    try {
      const category = normalizeCategoryForm(req.body);

      if (!category.title) {
        return res.redirect('/tournaments/' + req.tournamentId + '#rules');
      }

      const [[sortOrder]] = await db.execute(
        'SELECT COALESCE(MAX(`SORT_ORDER`), -1) + 1 AS nextSortOrder FROM `RULE_CATEGORY` WHERE `TOURNAMENT_ID` = ?',
        [req.tournamentId]
      );

      const [result] = await db.execute(
        'INSERT INTO `RULE_CATEGORY` (`VERSION`, `TOURNAMENT_ID`, `TITLE`, `SORT_ORDER`, `CREATED_AT`) VALUES (?, ?, ?, ?, NOW())',
        ['1', req.tournamentId, category.title, sortOrder.nextSortOrder]
      );

      res.redirect(getSectionRedirectPath(req.tournamentId, 'rule-category', result.insertId, 'rules'));
    } catch (error) {
      next(error);
    }
  });

  router.post('/tournaments/:id/rule-categories/:categoryId', requireLogin, requireTournamentAdmin, async function updateRuleCategory(req, res, next) {
    try {
      const categoryId = normalizeInteger(req.params.categoryId, 0, 1);
      const category = normalizeCategoryForm(req.body);

      if (!categoryId || !category.title) {
        return res.redirect(getSectionRedirectPath(req.tournamentId, 'rule-category', categoryId, 'rules', req.body.returnTo));
      }

      const [result] = await db.execute(
        'UPDATE `RULE_CATEGORY` SET `TITLE` = ?, `UPDATED_AT` = NOW() WHERE `ID` = ? AND `TOURNAMENT_ID` = ?',
        [category.title, categoryId, req.tournamentId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).render('error', {
          message: 'Rule category not found.',
          error: { status: 404 }
        });
      }

      res.redirect(getSectionRedirectPath(req.tournamentId, 'rule-category', categoryId, 'rules', req.body.returnTo));
    } catch (error) {
      next(error);
    }
  });

  router.post('/tournaments/:id/rule-categories/:categoryId/items', requireLogin, requireTournamentAdmin, async function addRuleItem(req, res, next) {
    try {
      const categoryId = normalizeInteger(req.params.categoryId, 0, 1);
      const item = normalizeRuleItemForm(req.body);

      if (!categoryId || (!item.heading && !item.body)) {
        return res.redirect(getSectionRedirectPath(req.tournamentId, 'rule-category', categoryId, 'rules', req.body.returnTo));
      }

      const valid = await ruleCategoryBelongsToTournament(categoryId, req.tournamentId);
      if (!valid) {
        return res.status(404).render('error', {
          message: 'Rule category not found.',
          error: { status: 404 }
        });
      }

      const [[sortOrder]] = await db.execute(
        'SELECT COALESCE(MAX(`SORT_ORDER`), -1) + 1 AS nextSortOrder FROM `RULE_ITEM` WHERE `RULE_CATEGORY_ID` = ?',
        [categoryId]
      );

      await db.execute(
        [
          'INSERT INTO `RULE_ITEM`',
          '(`VERSION`, `RULE_CATEGORY_ID`, `HEADING`, `BODY`, `ITEM_TYPE`, `SORT_ORDER`, `CREATED_AT`)',
          'VALUES (?, ?, ?, ?, ?, ?, NOW())'
        ].join(' '),
        ['1', categoryId, item.heading || null, item.body || null, item.itemType, sortOrder.nextSortOrder]
      );

      res.redirect(getSectionRedirectPath(req.tournamentId, 'rule-category', categoryId, 'rules', req.body.returnTo));
    } catch (error) {
      next(error);
    }
  });

  router.post('/tournaments/:id/rule-categories/:categoryId/items/:itemId', requireLogin, requireTournamentAdmin, async function updateRuleItem(req, res, next) {
    try {
      const categoryId = normalizeInteger(req.params.categoryId, 0, 1);
      const itemId = normalizeInteger(req.params.itemId, 0, 1);
      const item = normalizeRuleItemForm(req.body);

      if (!categoryId || !itemId || (!item.heading && !item.body)) {
        return res.redirect(getSectionRedirectPath(req.tournamentId, 'rule-category', categoryId, 'rules', req.body.returnTo));
      }

      const [result] = await db.execute(
        [
          'UPDATE `RULE_ITEM`',
          'INNER JOIN `RULE_CATEGORY` ON `RULE_CATEGORY`.`ID` = `RULE_ITEM`.`RULE_CATEGORY_ID`',
          'SET `RULE_ITEM`.`HEADING` = ?, `RULE_ITEM`.`BODY` = ?, `RULE_ITEM`.`ITEM_TYPE` = ?, `RULE_ITEM`.`UPDATED_AT` = NOW()',
          'WHERE `RULE_ITEM`.`ID` = ? AND `RULE_ITEM`.`RULE_CATEGORY_ID` = ? AND `RULE_CATEGORY`.`TOURNAMENT_ID` = ?'
        ].join(' '),
        [item.heading || null, item.body || null, item.itemType, itemId, categoryId, req.tournamentId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).render('error', {
          message: 'Rule item not found.',
          error: { status: 404 }
        });
      }

      res.redirect(getSectionRedirectPath(req.tournamentId, 'rule-category', categoryId, 'rules', req.body.returnTo));
    } catch (error) {
      next(error);
    }
  });

  router.post('/tournaments/:id/staff-categories', requireLogin, requireTournamentAdmin, async function addStaffCategory(req, res, next) {
    try {
      const category = normalizeCategoryForm(req.body);

      if (!category.title) {
        return res.redirect('/tournaments/' + req.tournamentId + '#staff');
      }

      const [[sortOrder]] = await db.execute(
        'SELECT COALESCE(MAX(`SORT_ORDER`), -1) + 1 AS nextSortOrder FROM `STAFF_CATEGORY` WHERE `TOURNAMENT_ID` = ?',
        [req.tournamentId]
      );

      const [result] = await db.execute(
        'INSERT INTO `STAFF_CATEGORY` (`VERSION`, `TOURNAMENT_ID`, `TITLE`, `SORT_ORDER`, `CREATED_AT`) VALUES (?, ?, ?, ?, NOW())',
        ['1', req.tournamentId, category.title, sortOrder.nextSortOrder]
      );

      res.redirect(getSectionRedirectPath(req.tournamentId, 'staff-category', result.insertId, 'staff'));
    } catch (error) {
      next(error);
    }
  });

  router.post('/tournaments/:id/staff-categories/:categoryId', requireLogin, requireTournamentAdmin, async function updateStaffCategory(req, res, next) {
    try {
      const categoryId = normalizeInteger(req.params.categoryId, 0, 1);
      const category = normalizeCategoryForm(req.body);

      if (!categoryId || !category.title) {
        return res.redirect(getSectionRedirectPath(req.tournamentId, 'staff-category', categoryId, 'staff', req.body.returnTo));
      }

      const [result] = await db.execute(
        'UPDATE `STAFF_CATEGORY` SET `TITLE` = ?, `UPDATED_AT` = NOW() WHERE `ID` = ? AND `TOURNAMENT_ID` = ?',
        [category.title, categoryId, req.tournamentId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).render('error', {
          message: 'Staff category not found.',
          error: { status: 404 }
        });
      }

      res.redirect(getSectionRedirectPath(req.tournamentId, 'staff-category', categoryId, 'staff', req.body.returnTo));
    } catch (error) {
      next(error);
    }
  });

  router.post('/tournaments/:id/staff-categories/:categoryId/members', requireLogin, requireTournamentAdmin, async function addStaffMember(req, res, next) {
    try {
      const categoryId = normalizeInteger(req.params.categoryId, 0, 1);
      const member = normalizeStaffMemberForm(req.body);

      if (!categoryId || !member.name) {
        return res.redirect(getSectionRedirectPath(req.tournamentId, 'staff-category', categoryId, 'staff', req.body.returnTo));
      }

      const valid = await staffCategoryBelongsToTournament(categoryId, req.tournamentId);
      if (!valid) {
        return res.status(404).render('error', {
          message: 'Staff category not found.',
          error: { status: 404 }
        });
      }

      const [[sortOrder]] = await db.execute(
        'SELECT COALESCE(MAX(`SORT_ORDER`), -1) + 1 AS nextSortOrder FROM `STAFF_MEMBER` WHERE `STAFF_CATEGORY_ID` = ?',
        [categoryId]
      );

      await db.execute(
        [
          'INSERT INTO `STAFF_MEMBER`',
          '(`VERSION`, `STAFF_CATEGORY_ID`, `NAME`, `SOCIAL_LABEL`, `SOCIAL_URL`, `SORT_ORDER`, `CREATED_AT`)',
          'VALUES (?, ?, ?, ?, ?, ?, NOW())'
        ].join(' '),
        ['1', categoryId, member.name, member.socialLabel || null, member.socialUrl || null, sortOrder.nextSortOrder]
      );

      res.redirect(getSectionRedirectPath(req.tournamentId, 'staff-category', categoryId, 'staff', req.body.returnTo));
    } catch (error) {
      next(error);
    }
  });

  router.post('/tournaments/:id/staff-categories/:categoryId/members/:memberId', requireLogin, requireTournamentAdmin, async function updateStaffMember(req, res, next) {
    try {
      const categoryId = normalizeInteger(req.params.categoryId, 0, 1);
      const memberId = normalizeInteger(req.params.memberId, 0, 1);
      const member = normalizeStaffMemberForm(req.body);

      if (!categoryId || !memberId || !member.name) {
        return res.redirect(getSectionRedirectPath(req.tournamentId, 'staff-category', categoryId, 'staff', req.body.returnTo));
      }

      const [result] = await db.execute(
        [
          'UPDATE `STAFF_MEMBER`',
          'INNER JOIN `STAFF_CATEGORY` ON `STAFF_CATEGORY`.`ID` = `STAFF_MEMBER`.`STAFF_CATEGORY_ID`',
          'SET `STAFF_MEMBER`.`NAME` = ?, `STAFF_MEMBER`.`SOCIAL_LABEL` = ?, `STAFF_MEMBER`.`SOCIAL_URL` = ?, `STAFF_MEMBER`.`UPDATED_AT` = NOW()',
          'WHERE `STAFF_MEMBER`.`ID` = ? AND `STAFF_MEMBER`.`STAFF_CATEGORY_ID` = ? AND `STAFF_CATEGORY`.`TOURNAMENT_ID` = ?'
        ].join(' '),
        [member.name, member.socialLabel || null, member.socialUrl || null, memberId, categoryId, req.tournamentId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).render('error', {
          message: 'Staff member not found.',
          error: { status: 404 }
        });
      }

      res.redirect(getSectionRedirectPath(req.tournamentId, 'staff-category', categoryId, 'staff', req.body.returnTo));
    } catch (error) {
      next(error);
    }
  });

  router.get('/tournaments/:id/view', renderTournamentPage('participant'));
  router.get('/tournaments/:id', requireLogin, requireTournamentAdmin, renderTournamentPage('organizer'));

  return router;
};

function renderTournamentPage(viewMode) {
  return async function renderTournament(req, res, next) {
    try {
      const tournamentId = normalizeInteger(req.params.id, 0, 1);
      const tournamentData = await getTournamentData(tournamentId);

      if (!tournamentData) {
        return res.status(404).render('error', {
          message: 'Tournament not found.',
          error: { status: 404 }
        });
      }

      const sessionUserId = normalizeInteger(req.session.user && req.session.user.id, 0, 1);
      const canManage = viewMode === 'organizer' || await userCanManageTournament(sessionUserId, tournamentId);

      res.render('pages/tournamentDetails', {
        title: tournamentData.tournament.NAME,
        activePage: null,
        viewMode,
        canManage,
        ...tournamentData
      });
    } catch (error) {
      next(error);
    }
  };
}

async function requireLogin(req, res, next) {
  try {
    const sessionUserId = normalizeInteger(req.session.user && req.session.user.id, 0, 1);

    if (!sessionUserId) {
      return res.redirect('/?showLogin=true');
    }

    const [users] = await db.execute(
      'SELECT `ID`, `NAME` FROM `USER` WHERE `ID` = ? LIMIT 1',
      [sessionUserId]
    );
    const user = users[0];

    if (!user) {
      return req.session.destroy(function destroyStaleSession() {
        res.clearCookie('dbdturniere.sid');
        res.redirect('/?showLogin=true');
      });
    }

    req.currentUser = {
      id: user.ID,
      name: user.NAME
    };
    req.session.user = {
      ...req.session.user,
      id: user.ID,
      name: user.NAME
    };

    next();
  } catch (error) {
    next(error);
  }
}

async function requireTournamentAdmin(req, res, next) {
  try {
    const tournamentId = normalizeInteger(req.params.id, 0, 1);

    if (!tournamentId) {
      return res.status(404).render('error', {
        message: 'Tournament not found.',
        error: { status: 404 }
      });
    }

    const [admins] = await db.execute(
      [
        'SELECT `ID`',
        'FROM `TOURNAMENT_ADMINS`',
        'WHERE `TOURNAMENT_ID` = ? AND `USER_ID` = ?',
        'LIMIT 1'
      ].join(' '),
      [tournamentId, req.currentUser.id]
    );

    if (!admins.length) {
      return res.status(403).render('error', {
        message: 'You are not an organizer for this tournament.',
        error: { status: 403 }
      });
    }

    req.tournamentId = tournamentId;
    next();
  } catch (error) {
    next(error);
  }
}

async function userCanManageTournament(userId, tournamentId) {
  if (!userId || !tournamentId) {
    return false;
  }

  const [admins] = await db.execute(
    [
      'SELECT `ID`',
      'FROM `TOURNAMENT_ADMINS`',
      'WHERE `TOURNAMENT_ID` = ? AND `USER_ID` = ?',
      'LIMIT 1'
    ].join(' '),
    [tournamentId, userId]
  );

  return admins.length > 0;
}

function createDefaultTournamentForm() {
  return {
    name: '',
    startsAt: '',
    endsAt: '',
    description: '',
    scoringMode: 'points',
    gamesPerMatch: 2,
    teamSlotCount: 8,
    allowKillerBans: false,
    killerBanCount: 0,
    allowMapBans: false,
    mapBanCount: 0,
    createDefaultRules: true,
    createDefaultStaff: true,
    scoringCategories: [
      { displayName: 'Generator', pointsPerOccurrence: 1, maxOccurrences: 5 },
      { displayName: 'Kill', pointsPerOccurrence: 0.5, maxOccurrences: 4 },
      { displayName: 'Escape', pointsPerOccurrence: 1, maxOccurrences: 4 }
    ]
  };
}

const DEFAULT_RULE_CATEGORIES = [
  'Perks',
  'Items',
  'Maps',
  'Termine',
  'Sonstiges'
];

const DEFAULT_STAFF_CATEGORIES = [
  'Schiedsrichter',
  'Organisatoren'
];

const PLACEHOLDER_RULE_CATEGORIES = ['Sonstiges'];
const PLACEHOLDER_STAFF_CATEGORIES = ['Organisatoren'];

function getRuleCategoriesForTournament(form) {
  if (!form.createDefaultRules) {
    return PLACEHOLDER_RULE_CATEGORIES;
  }

  const categories = [...DEFAULT_RULE_CATEGORIES];

  if (form.scoringMode === 'points') {
    categories.splice(2, 0, 'Points');
  }

  return categories;
}

function getStaffCategoriesForTournament(form) {
  return form.createDefaultStaff ? DEFAULT_STAFF_CATEGORIES : PLACEHOLDER_STAFF_CATEGORIES;
}

function normalizeTournamentForm(body) {
  const defaultForm = createDefaultTournamentForm();
  const displayNames = toArray(body.scoringDisplayName);
  const points = toArray(body.scoringPointsPerOccurrence);
  const maxOccurrences = toArray(body.scoringMaxOccurrences);
  const rowCount = Math.max(displayNames.length, points.length, maxOccurrences.length, 1);
  const banConfig = normalizeBanConfigForm(body);

  return {
    name: normalizeText(body.name),
    startsAt: normalizeText(body.startsAt),
    endsAt: normalizeText(body.endsAt),
    description: normalizeText(body.description),
    scoringMode: ['points', 'wl'].includes(body.scoringMode) ? body.scoringMode : defaultForm.scoringMode,
    gamesPerMatch: normalizeInteger(body.gamesPerMatch, defaultForm.gamesPerMatch, 1),
    teamSlotCount: normalizeInteger(body.teamSlotCount, defaultForm.teamSlotCount, 0),
    ...banConfig,
    createDefaultRules: body.createDefaultRules === 'on',
    createDefaultStaff: body.createDefaultStaff === 'on',
    scoringCategories: Array.from({ length: rowCount }, (_, index) => ({
      displayName: normalizeText(displayNames[index]),
      pointsPerOccurrence: normalizeDecimal(points[index], 0),
      maxOccurrences: normalizeInteger(maxOccurrences[index], 0, 0),
      actualOccurrences: 0
    })).filter((category) => category.displayName)
  };
}

function normalizeBanConfigForm(body) {
  const allowKillerBans = body.allowKillerBans === 'on';
  const allowMapBans = body.allowMapBans === 'on';

  return {
    allowKillerBans,
    killerBanCount: allowKillerBans ? normalizeInteger(body.killerBanCount, 0, 0) : 0,
    allowMapBans,
    mapBanCount: allowMapBans ? normalizeInteger(body.mapBanCount, 0, 0) : 0
  };
}

function normalizeTeamForm(body, banConfig = {}) {
  const killerBans = banConfig.allowKillerBans
    ? normalizeBanList(body.killerBans, banConfig.killerBanCount)
    : [];
  const mapBans = banConfig.allowMapBans
    ? normalizeBanList(body.mapBans, banConfig.mapBanCount)
    : [];

  return {
    name: normalizeText(body.name),
    shorthand: normalizeText(body.shorthand),
    killerBans,
    mapBans,
    killerBansJson: stringifyBanList(killerBans),
    mapBansJson: stringifyBanList(mapBans)
  };
}

function normalizePlayerForm(body) {
  return {
    name: normalizeText(body.name),
    steamId: normalizeText(body.steamId),
    playerRole: 'player',
    isTeamLeader: body.isTeamLeader === 'on'
  };
}

function normalizeGameDayForm(body) {
  return {
    title: normalizeText(body.title),
    gameDate: normalizeText(body.gameDate)
  };
}

function normalizeMatchupForm(body) {
  return {
    teamOneId: normalizeInteger(body.teamOneId, 0, 1),
    teamTwoId: normalizeInteger(body.teamTwoId, 0, 1)
  };
}

function normalizeMatchupScoreEntries(body, matchup, categories) {
  const gamesPerMatch = normalizeInteger(matchup.GAMES_PER_MATCH, 2, 1);
  const teamIds = [matchup.TEAM_ONE_ID, matchup.TEAM_TWO_ID].filter(Boolean).map(Number);
  const entries = [];

  for (let gameNumber = 1; gameNumber <= gamesPerMatch; gameNumber += 1) {
    for (const category of categories) {
      for (const teamId of teamIds) {
        const fieldName = `score_${gameNumber}_${category.ID}_${teamId}`;
        const maxOccurrences = Number(category.MAX_OCCURRENCES || 0);
        let occurrences = normalizeScoreOccurrence(body[fieldName]);

        if (maxOccurrences > 0) {
          occurrences = Math.min(occurrences, maxOccurrences);
        }

        if (occurrences > 0) {
          entries.push({
            gameNumber,
            categoryId: category.ID,
            teamId,
            occurrences
          });
        }
      }
    }
  }

  return entries;
}

function normalizeScoringCategoryForm(body) {
  return {
    displayName: normalizeText(body.displayName),
    pointsPerOccurrence: normalizeDecimal(body.pointsPerOccurrence, 0),
    maxOccurrences: normalizeInteger(body.maxOccurrences, 0, 0),
    actualOccurrences: 0
  };
}

function normalizeCategoryForm(body) {
  return {
    title: normalizeText(body.title)
  };
}

function normalizeRuleItemForm(body) {
  return {
    heading: normalizeText(body.heading),
    body: normalizeText(body.body),
    itemType: normalizeText(body.itemType) || 'text'
  };
}

function normalizeStaffMemberForm(body) {
  return {
    name: normalizeText(body.name),
    socialLabel: normalizeText(body.socialLabel),
    socialUrl: normalizeText(body.socialUrl)
  };
}

function getTeamRedirectPath(tournamentId, teamId, returnTo) {
  const safeReturnTo = normalizeReturnAnchor(returnTo);

  if (safeReturnTo) {
    return `/tournaments/${tournamentId}${safeReturnTo}`;
  }

  return teamId ? `/tournaments/${tournamentId}#team-${teamId}` : `/tournaments/${tournamentId}#teams`;
}

function getSectionRedirectPath(tournamentId, anchorPrefix, itemId, fallbackAnchor, returnTo) {
  const safeReturnTo = normalizeReturnAnchor(returnTo);

  if (safeReturnTo) {
    return `/tournaments/${tournamentId}${safeReturnTo}`;
  }

  return itemId ? `/tournaments/${tournamentId}#${anchorPrefix}-${itemId}` : `/tournaments/${tournamentId}#${fallbackAnchor}`;
}

function getGameDayRedirectPath(tournamentId, gameDayId, returnTo) {
  const safeReturnTo = normalizeReturnAnchor(returnTo);

  if (safeReturnTo) {
    return `/tournaments/${tournamentId}${safeReturnTo}`;
  }

  return gameDayId ? `/tournaments/${tournamentId}#game-day-${gameDayId}` : `/tournaments/${tournamentId}#game-days`;
}

function normalizeReturnAnchor(value) {
  const anchor = normalizeText(value);

  if (!anchor || !/^#[A-Za-z][A-Za-z0-9_-]*$/.test(anchor)) {
    return '';
  }

  return anchor;
}

async function findUserIdByName(connection, name) {
  const [users] = await connection.execute(
    'SELECT `ID` FROM `USER` WHERE `NAME` = ? LIMIT 1',
    [name]
  );

  return users[0] ? users[0].ID : null;
}

async function gameDayBelongsToTournament(gameDayId, tournamentId) {
  const [gameDays] = await db.execute(
    'SELECT `ID` FROM `TOURNAMENT_GAME_DAY` WHERE `ID` = ? AND `TOURNAMENT_ID` = ? LIMIT 1',
    [gameDayId, tournamentId]
  );

  return gameDays.length > 0;
}

async function ruleCategoryBelongsToTournament(categoryId, tournamentId) {
  const [categories] = await db.execute(
    'SELECT `ID` FROM `RULE_CATEGORY` WHERE `ID` = ? AND `TOURNAMENT_ID` = ? LIMIT 1',
    [categoryId, tournamentId]
  );

  return categories.length > 0;
}

async function staffCategoryBelongsToTournament(categoryId, tournamentId) {
  const [categories] = await db.execute(
    'SELECT `ID` FROM `STAFF_CATEGORY` WHERE `ID` = ? AND `TOURNAMENT_ID` = ? LIMIT 1',
    [categoryId, tournamentId]
  );

  return categories.length > 0;
}

async function getTournamentBanConfig(tournamentId) {
  const [[tournament]] = await db.execute(
    [
      'SELECT `ALLOW_KILLER_BANS`, `KILLER_BAN_COUNT`, `ALLOW_MAP_BANS`, `MAP_BAN_COUNT`',
      'FROM `TOURNAMENT`',
      'WHERE `ID` = ?',
      'LIMIT 1'
    ].join(' '),
    [tournamentId]
  );

  return {
    allowKillerBans: Boolean(tournament && tournament.ALLOW_KILLER_BANS),
    killerBanCount: normalizeInteger(tournament && tournament.KILLER_BAN_COUNT, 0, 0),
    allowMapBans: Boolean(tournament && tournament.ALLOW_MAP_BANS),
    mapBanCount: normalizeInteger(tournament && tournament.MAP_BAN_COUNT, 0, 0)
  };
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return value === undefined ? [] : [value];
}

function normalizeText(value) {
  const text = String(value || '').trim();
  return text || '';
}

function normalizeBanList(value, maxCount) {
  const limit = normalizeInteger(maxCount, 0, 0);

  if (limit <= 0) {
    return [];
  }

  const seen = new Set();
  const rawItems = Array.isArray(value)
    ? value
    : String(value || '').split(/\r?\n/);
  const bans = [];

  for (const item of rawItems) {
    const ban = normalizeText(item);
    const key = ban.toLocaleLowerCase();

    if (!ban || seen.has(key)) {
      continue;
    }

    seen.add(key);
    bans.push(ban);

    if (bans.length >= limit) {
      break;
    }
  }

  return bans;
}

function stringifyBanList(bans) {
  return bans && bans.length ? JSON.stringify(bans) : null;
}

function parseBanList(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(normalizeText).filter(Boolean) : [];
  } catch (error) {
    return String(value).split(/\r?\n/).map(normalizeText).filter(Boolean);
  }
}

function normalizeDecimal(value, fallback) {
  const number = Number(String(value || '').replace(',', '.'));
  return Number.isFinite(number) ? number : fallback;
}

function normalizeScoreOccurrence(value) {
  const number = normalizeDecimal(value, 0);
  return number > 0 ? number : 0;
}

function normalizeInteger(value, fallback, min) {
  const number = Number(value);
  return Number.isInteger(number) && number >= min ? number : fallback;
}

async function getTournamentData(tournamentId) {
  const [[tournament]] = await db.execute(
    [
      'SELECT',
      '`ID`, `NAME`, `DESCRIPTION`, `STARTS_AT`, `ENDS_AT`, `SCORING_MODE`, `GAMES_PER_MATCH`,',
      '`ALLOW_KILLER_BANS`, `KILLER_BAN_COUNT`, `ALLOW_MAP_BANS`, `MAP_BAN_COUNT`, `CREATED_AT`',
      'FROM `TOURNAMENT`',
      'WHERE `ID` = ?',
      'LIMIT 1'
    ].join(' '),
    [tournamentId]
  );

  if (!tournament) {
    return null;
  }

  const [scoringCategories] = await db.execute(
    [
      'SELECT `ID`, `DISPLAY_NAME`, `POINTS_PER_OCCURRENCE`, `MAX_OCCURRENCES`, `ACTUAL_OCCURRENCES`',
      'FROM `SCORING_CATEGORY`',
      'WHERE `TOURNAMENT_ID` = ?',
      'ORDER BY `SORT_ORDER`, `ID`'
    ].join(' '),
    [tournamentId]
  );

  const [teams] = await db.execute(
    [
      'SELECT `ID`, `NAME`, `SHORTHAND`, `KILLER_BANS`, `MAP_BANS`',
      'FROM `TOURNAMENT_TEAM`',
      'WHERE `TOURNAMENT_ID` = ?',
      'ORDER BY `SORT_ORDER`, `ID`'
    ].join(' '),
    [tournamentId]
  );
  const [players] = await db.execute(
    [
      'SELECT `ID`, `TEAM_ID`, `NAME`, `STEAM_ID`, `PLAYER_ROLE`, `IS_TEAM_LEADER`',
      'FROM `TOURNAMENT_PLAYER`',
      'WHERE `TOURNAMENT_ID` = ?',
      'ORDER BY `TEAM_ID`, `SORT_ORDER`, `ID`'
    ].join(' '),
    [tournamentId]
  );
  const [ruleCategories] = await db.execute(
    [
      'SELECT `ID`, `TITLE`',
      'FROM `RULE_CATEGORY`',
      'WHERE `TOURNAMENT_ID` = ?',
      'ORDER BY `SORT_ORDER`, `ID`'
    ].join(' '),
    [tournamentId]
  );
  const [ruleItems] = await db.execute(
    [
      'SELECT',
      '`RULE_ITEM`.`ID`,',
      '`RULE_ITEM`.`RULE_CATEGORY_ID`,',
      '`RULE_ITEM`.`HEADING`,',
      '`RULE_ITEM`.`BODY`,',
      '`RULE_ITEM`.`ITEM_TYPE`',
      'FROM `RULE_ITEM`',
      'INNER JOIN `RULE_CATEGORY` ON `RULE_CATEGORY`.`ID` = `RULE_ITEM`.`RULE_CATEGORY_ID`',
      'WHERE `RULE_CATEGORY`.`TOURNAMENT_ID` = ?',
      'ORDER BY `RULE_ITEM`.`RULE_CATEGORY_ID`, `RULE_ITEM`.`SORT_ORDER`, `RULE_ITEM`.`ID`'
    ].join(' '),
    [tournamentId]
  );
  const [staffCategories] = await db.execute(
    [
      'SELECT `ID`, `TITLE`',
      'FROM `STAFF_CATEGORY`',
      'WHERE `TOURNAMENT_ID` = ?',
      'ORDER BY `SORT_ORDER`, `ID`'
    ].join(' '),
    [tournamentId]
  );
  const [staffMembers] = await db.execute(
    [
      'SELECT',
      '`STAFF_MEMBER`.`ID`,',
      '`STAFF_MEMBER`.`STAFF_CATEGORY_ID`,',
      '`STAFF_MEMBER`.`NAME`,',
      '`STAFF_MEMBER`.`SOCIAL_LABEL`,',
      '`STAFF_MEMBER`.`SOCIAL_URL`',
      'FROM `STAFF_MEMBER`',
      'INNER JOIN `STAFF_CATEGORY` ON `STAFF_CATEGORY`.`ID` = `STAFF_MEMBER`.`STAFF_CATEGORY_ID`',
      'WHERE `STAFF_CATEGORY`.`TOURNAMENT_ID` = ?',
      'ORDER BY `STAFF_MEMBER`.`STAFF_CATEGORY_ID`, `STAFF_MEMBER`.`SORT_ORDER`, `STAFF_MEMBER`.`ID`'
    ].join(' '),
    [tournamentId]
  );
  const [gameDays] = await db.execute(
    [
      'SELECT `ID`, `TITLE`, `GAME_DATE`',
      'FROM `TOURNAMENT_GAME_DAY`',
      'WHERE `TOURNAMENT_ID` = ?',
      'ORDER BY `SORT_ORDER`, `GAME_DATE`, `ID`'
    ].join(' '),
    [tournamentId]
  );
  const [matchups] = await db.execute(
    [
      'SELECT',
      '`TOURNAMENT_MATCHUP`.`ID`,',
      '`TOURNAMENT_MATCHUP`.`GAME_DAY_ID`,',
      '`TOURNAMENT_MATCHUP`.`TEAM_ONE_ID`,',
      '`TOURNAMENT_MATCHUP`.`TEAM_TWO_ID`,',
      '`TEAM_ONE`.`NAME` AS `TEAM_ONE_NAME`,',
      '`TEAM_TWO`.`NAME` AS `TEAM_TWO_NAME`',
      'FROM `TOURNAMENT_MATCHUP`',
      'LEFT JOIN `TOURNAMENT_TEAM` AS `TEAM_ONE` ON `TEAM_ONE`.`ID` = `TOURNAMENT_MATCHUP`.`TEAM_ONE_ID`',
      'LEFT JOIN `TOURNAMENT_TEAM` AS `TEAM_TWO` ON `TEAM_TWO`.`ID` = `TOURNAMENT_MATCHUP`.`TEAM_TWO_ID`',
      'WHERE `TOURNAMENT_MATCHUP`.`TOURNAMENT_ID` = ?',
      'ORDER BY `TOURNAMENT_MATCHUP`.`GAME_DAY_ID`, `TOURNAMENT_MATCHUP`.`SORT_ORDER`, `TOURNAMENT_MATCHUP`.`ID`'
    ].join(' '),
    [tournamentId]
  );
  const [matchupScores] = await db.execute(
    [
      'SELECT',
      '`MATCHUP_ID`,',
      '`GAME_NUMBER`,',
      '`SCORING_CATEGORY_ID`,',
      '`TEAM_ID`,',
      '`OCCURRENCES`',
      'FROM `TOURNAMENT_MATCHUP_SCORE`',
      'WHERE `TOURNAMENT_ID` = ?',
      'ORDER BY `MATCHUP_ID`, `GAME_NUMBER`, `SCORING_CATEGORY_ID`, `TEAM_ID`'
    ].join(' '),
    [tournamentId]
  );
  const [admins] = await db.execute(
    [
      'SELECT',
      '`USER`.`ID`,',
      '`USER`.`NAME`,',
      '`TOURNAMENT_ADMINS`.`CREATED_AT`',
      'FROM `TOURNAMENT_ADMINS`',
      'INNER JOIN `USER` ON `USER`.`ID` = `TOURNAMENT_ADMINS`.`USER_ID`',
      'WHERE `TOURNAMENT_ADMINS`.`TOURNAMENT_ID` = ?',
      'ORDER BY `TOURNAMENT_ADMINS`.`CREATED_AT`, `USER`.`NAME`'
    ].join(' '),
    [tournamentId]
  );

  const [[teamCount]] = await db.execute(
    'SELECT COUNT(*) AS count FROM `TOURNAMENT_TEAM` WHERE `TOURNAMENT_ID` = ?',
    [tournamentId]
  );
  const [[ruleCategoryCount]] = await db.execute(
    'SELECT COUNT(*) AS count FROM `RULE_CATEGORY` WHERE `TOURNAMENT_ID` = ?',
    [tournamentId]
  );
  const [[staffCategoryCount]] = await db.execute(
    'SELECT COUNT(*) AS count FROM `STAFF_CATEGORY` WHERE `TOURNAMENT_ID` = ?',
    [tournamentId]
  );
  const [[gameDayCount]] = await db.execute(
    'SELECT COUNT(*) AS count FROM `TOURNAMENT_GAME_DAY` WHERE `TOURNAMENT_ID` = ?',
    [tournamentId]
  );

  const teamsWithPlayers = attachPlayersToTeams(teams || [], players || []);
  const gameDaysWithMatchups = attachMatchupsToGameDays(gameDays || [], matchups || [], tournament.GAMES_PER_MATCH, scoringCategories || [], matchupScores || []);

  return {
    tournament: {
      ...tournament,
      STARTS_AT_DISPLAY: formatDateForDisplay(tournament.STARTS_AT),
      ENDS_AT_DISPLAY: formatDateForDisplay(tournament.ENDS_AT)
    },
    scoringCategories: scoringCategories || [],
    teams: teamsWithPlayers,
    gameDays: gameDaysWithMatchups,
    rankings: buildTeamRankings(teamsWithPlayers, gameDaysWithMatchups),
    admins: admins || [],
    ruleCategories: attachRuleItemsToCategories(ruleCategories || [], ruleItems || []),
    staffCategories: attachStaffMembersToCategories(staffCategories || [], staffMembers || []),
    counts: {
      teams: teamCount.count,
      gameDays: gameDayCount.count,
      ruleCategories: ruleCategoryCount.count,
      staffCategories: staffCategoryCount.count
    }
  };
}

function attachRuleItemsToCategories(categories, items) {
  const itemsByCategoryId = new Map();

  for (const item of items) {
    const categoryItems = itemsByCategoryId.get(item.RULE_CATEGORY_ID) || [];
    categoryItems.push(item);
    itemsByCategoryId.set(item.RULE_CATEGORY_ID, categoryItems);
  }

  return categories.map((category) => ({
    ...category,
    ITEMS: itemsByCategoryId.get(category.ID) || []
  }));
}

function attachStaffMembersToCategories(categories, members) {
  const membersByCategoryId = new Map();

  for (const member of members) {
    const categoryMembers = membersByCategoryId.get(member.STAFF_CATEGORY_ID) || [];
    categoryMembers.push(member);
    membersByCategoryId.set(member.STAFF_CATEGORY_ID, categoryMembers);
  }

  return categories.map((category) => ({
    ...category,
    MEMBERS: membersByCategoryId.get(category.ID) || []
  }));
}

function attachPlayersToTeams(teams, players) {
  const playersByTeamId = new Map();

  for (const player of players) {
    const teamPlayers = playersByTeamId.get(player.TEAM_ID) || [];
    teamPlayers.push(player);
    playersByTeamId.set(player.TEAM_ID, teamPlayers);
  }

  return teams.map((team) => ({
    ...team,
    KILLER_BAN_LIST: parseBanList(team.KILLER_BANS),
    KILLER_BANS_TEXT: parseBanList(team.KILLER_BANS).join('\n'),
    MAP_BAN_LIST: parseBanList(team.MAP_BANS),
    MAP_BANS_TEXT: parseBanList(team.MAP_BANS).join('\n'),
    PLAYERS: playersByTeamId.get(team.ID) || []
  }));
}

function attachMatchupsToGameDays(gameDays, matchups, gamesPerMatch, scoringCategories, scoreRows) {
  const matchupsByGameDayId = new Map();
  const scoresByMatchupId = new Map();

  for (const row of scoreRows) {
    const matchupScores = scoresByMatchupId.get(row.MATCHUP_ID) || [];
    matchupScores.push(row);
    scoresByMatchupId.set(row.MATCHUP_ID, matchupScores);
  }

  for (const matchup of matchups) {
    const dayMatchups = matchupsByGameDayId.get(matchup.GAME_DAY_ID) || [];
    const scoreData = buildMatchupScoreData(matchup, gamesPerMatch, scoringCategories, scoresByMatchupId.get(matchup.ID) || []);
    dayMatchups.push({
      ...matchup,
      ...scoreData
    });
    matchupsByGameDayId.set(matchup.GAME_DAY_ID, dayMatchups);
  }

  return gameDays.map((gameDay) => ({
    ...gameDay,
    GAME_DATE_DISPLAY: formatDateForDisplay(gameDay.GAME_DATE),
    MATCHUPS: matchupsByGameDayId.get(gameDay.ID) || []
  }));
}

function buildTeamRankings(teams, gameDays) {
  const rankingByTeamId = new Map();

  for (const team of teams) {
    rankingByTeamId.set(Number(team.ID), {
      ID: team.ID,
      NAME: team.NAME,
      SHORTHAND: team.SHORTHAND,
      POINTS: 0,
      MATCHES_PLAYED: 0
    });
  }

  for (const gameDay of gameDays) {
    for (const matchup of gameDay.MATCHUPS || []) {
      if (!matchup.HAS_SCORES) {
        continue;
      }

      const teamOne = rankingByTeamId.get(Number(matchup.TEAM_ONE_ID));
      const teamTwo = rankingByTeamId.get(Number(matchup.TEAM_TWO_ID));

      if (teamOne) {
        teamOne.POINTS += Number(matchup.TEAM_ONE_TOTAL || 0);
        teamOne.MATCHES_PLAYED += 1;
      }

      if (teamTwo) {
        teamTwo.POINTS += Number(matchup.TEAM_TWO_TOTAL || 0);
        teamTwo.MATCHES_PLAYED += 1;
      }
    }
  }

  const sortedRankings = [...rankingByTeamId.values()].sort((left, right) => {
    if (right.POINTS !== left.POINTS) {
      return right.POINTS - left.POINTS;
    }

    return left.NAME.localeCompare(right.NAME);
  });

  let previousPoints = null;
  let currentRank = 0;

  return sortedRankings.map((team, index) => {
    if (previousPoints === null || team.POINTS !== previousPoints) {
      currentRank = index + 1;
      previousPoints = team.POINTS;
    }

    return {
      ...team,
      RANK: currentRank,
      RANK_LABEL: formatRankLabel(currentRank)
    };
  });
}

function formatRankLabel(rank) {
  const remainder = rank % 100;

  if (remainder >= 11 && remainder <= 13) {
    return `${rank}th`;
  }

  switch (rank % 10) {
    case 1:
      return `${rank}st`;
    case 2:
      return `${rank}nd`;
    case 3:
      return `${rank}rd`;
    default:
      return `${rank}th`;
  }
}

function buildMatchupScoreData(matchup, gamesPerMatch, scoringCategories, scoreRows) {
  const gameCount = normalizeInteger(gamesPerMatch, 2, 1);
  const scoreMap = new Map();
  const games = [];
  let matchupTeamOneTotal = 0;
  let matchupTeamTwoTotal = 0;
  let relevantScoreCount = 0;
  const currentTeamIds = [matchup.TEAM_ONE_ID, matchup.TEAM_TWO_ID].filter(Boolean).map(Number);

  for (const row of scoreRows) {
    scoreMap.set(`${row.GAME_NUMBER}:${row.SCORING_CATEGORY_ID}:${row.TEAM_ID}`, Number(row.OCCURRENCES || 0));

    if (currentTeamIds.includes(Number(row.TEAM_ID)) && Number(row.OCCURRENCES || 0) > 0) {
      relevantScoreCount += 1;
    }
  }

  for (let gameNumber = 1; gameNumber <= gameCount; gameNumber += 1) {
    const teamOneIsKiller = gameNumber % 2 === 1;
    let teamOneTotal = 0;
    let teamTwoTotal = 0;
    const categories = scoringCategories.map((category) => {
      const pointsPerOccurrence = Number(category.POINTS_PER_OCCURRENCE || 0);
      const teamOneOccurrences = matchup.TEAM_ONE_ID
        ? Number(scoreMap.get(`${gameNumber}:${category.ID}:${matchup.TEAM_ONE_ID}`) || 0)
        : 0;
      const teamTwoOccurrences = matchup.TEAM_TWO_ID
        ? Number(scoreMap.get(`${gameNumber}:${category.ID}:${matchup.TEAM_TWO_ID}`) || 0)
        : 0;
      const teamOnePoints = teamOneOccurrences * pointsPerOccurrence;
      const teamTwoPoints = teamTwoOccurrences * pointsPerOccurrence;

      teamOneTotal += teamOnePoints;
      teamTwoTotal += teamTwoPoints;

      return {
        ...category,
        TEAM_ONE_OCCURRENCES: teamOneOccurrences,
        TEAM_TWO_OCCURRENCES: teamTwoOccurrences,
        TEAM_ONE_POINTS: teamOnePoints,
        TEAM_TWO_POINTS: teamTwoPoints
      };
    });

    matchupTeamOneTotal += teamOneTotal;
    matchupTeamTwoTotal += teamTwoTotal;
    games.push({
      NUMBER: gameNumber,
      TEAM_ONE_ROLE: teamOneIsKiller ? 'Killer' : 'Survivors',
      TEAM_TWO_ROLE: teamOneIsKiller ? 'Survivors' : 'Killer',
      TEAM_ONE_TOTAL: teamOneTotal,
      TEAM_TWO_TOTAL: teamTwoTotal,
      CATEGORIES: categories
    });
  }

  return {
    GAMES: games,
    TEAM_ONE_TOTAL: matchupTeamOneTotal,
    TEAM_TWO_TOTAL: matchupTeamTwoTotal,
    HAS_SCORES: relevantScoreCount > 0
  };
}

async function getCreatedTournaments(userId) {
  const [tournaments] = await db.execute(
    [
      'SELECT',
      '`TOURNAMENT`.`ID`,',
      '`TOURNAMENT`.`NAME`,',
      '`TOURNAMENT`.`DESCRIPTION`,',
      '`TOURNAMENT`.`STARTS_AT`,',
      '`TOURNAMENT`.`ENDS_AT`,',
      '`TOURNAMENT`.`SCORING_MODE`,',
      '`TOURNAMENT`.`GAMES_PER_MATCH`,',
      '`TOURNAMENT`.`CREATED_AT`,',
      'COUNT(DISTINCT `TOURNAMENT_TEAM`.`ID`) AS `TEAM_COUNT`',
      'FROM `TOURNAMENT_ADMINS`',
      'INNER JOIN `TOURNAMENT` ON `TOURNAMENT`.`ID` = `TOURNAMENT_ADMINS`.`TOURNAMENT_ID`',
      'LEFT JOIN `TOURNAMENT_TEAM` ON `TOURNAMENT_TEAM`.`TOURNAMENT_ID` = `TOURNAMENT`.`ID`',
      'WHERE `TOURNAMENT_ADMINS`.`USER_ID` = ?',
      'GROUP BY',
      '`TOURNAMENT`.`ID`,',
      '`TOURNAMENT`.`NAME`,',
      '`TOURNAMENT`.`DESCRIPTION`,',
      '`TOURNAMENT`.`STARTS_AT`,',
      '`TOURNAMENT`.`ENDS_AT`,',
      '`TOURNAMENT`.`SCORING_MODE`,',
      '`TOURNAMENT`.`GAMES_PER_MATCH`,',
      '`TOURNAMENT`.`CREATED_AT`',
      'ORDER BY `TOURNAMENT`.`CREATED_AT` DESC, `TOURNAMENT`.`ID` DESC'
    ].join(' '),
    [userId]
  );

  return tournaments.map((tournament) => ({
    ...tournament,
    STARTS_AT_DISPLAY: formatDateForDisplay(tournament.STARTS_AT),
    ENDS_AT_DISPLAY: formatDateForDisplay(tournament.ENDS_AT)
  }));
}

async function getParticipantTournaments(userId) {
  const [tournaments] = await db.execute(
    [
      'SELECT',
      '`TOURNAMENT`.`ID`,',
      '`TOURNAMENT`.`NAME`,',
      '`TOURNAMENT`.`DESCRIPTION`,',
      '`TOURNAMENT`.`STARTS_AT`,',
      '`TOURNAMENT`.`ENDS_AT`,',
      '`TOURNAMENT`.`SCORING_MODE`,',
      '`TOURNAMENT`.`GAMES_PER_MATCH`,',
      '`TOURNAMENT_TEAM`.`NAME` AS `TEAM_NAME`,',
      '`TOURNAMENT_PLAYER`.`NAME` AS `PLAYER_NAME`,',
      '`TOURNAMENT_PLAYER`.`IS_TEAM_LEADER`',
      'FROM `TOURNAMENT_PLAYER`',
      'INNER JOIN `TOURNAMENT` ON `TOURNAMENT`.`ID` = `TOURNAMENT_PLAYER`.`TOURNAMENT_ID`',
      'LEFT JOIN `TOURNAMENT_TEAM` ON `TOURNAMENT_TEAM`.`ID` = `TOURNAMENT_PLAYER`.`TEAM_ID`',
      'WHERE `TOURNAMENT_PLAYER`.`USER_ID` = ?',
      'ORDER BY `TOURNAMENT`.`STARTS_AT` DESC, `TOURNAMENT`.`ID` DESC'
    ].join(' '),
    [userId]
  );

  return tournaments.map((tournament) => ({
    ...tournament,
    STARTS_AT_DISPLAY: formatDateForDisplay(tournament.STARTS_AT),
    ENDS_AT_DISPLAY: formatDateForDisplay(tournament.ENDS_AT)
  }));
}

function formatDateForDisplay(value) {
  if (!value) {
    return 'Not set';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const timezoneOffset = -date.getTimezoneOffset();
  const timezoneSign = timezoneOffset >= 0 ? '+' : '-';
  const timezoneHours = padDatePart(Math.floor(Math.abs(timezoneOffset) / 60));
  const timezoneMinutes = padDatePart(Math.abs(timezoneOffset) % 60);

  return [
    weekdays[date.getDay()],
    months[date.getMonth()],
    padDatePart(date.getDate()),
    date.getFullYear(),
    `${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}:${padDatePart(date.getSeconds())}`,
    `GMT${timezoneSign}${timezoneHours}${timezoneMinutes}`
  ].join(' ');
}

function padDatePart(value) {
  return String(value).padStart(2, '0');
}
