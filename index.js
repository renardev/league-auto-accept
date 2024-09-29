const {
	authenticate,
	createWebSocketConnection,
	createHttp1Request,
} = require("league-connect");
const checkUpdate = require("check-update-github");
const config = require("./config.json");
const logger = require("./tools/logger");
const pkg = require("./package.json");

logger.log("Checking for updates...");
checkUpdate(
	{
		name: pkg.name,
		currentVersion: pkg.version,
		user: "renardev",
		branch: "main",
	},
	function (err, latestVersion, defaultMessage) {
		if (!err) {
			console.log(defaultMessage);
		}
	}
);

if (config.acceptDelay > 10) logger.warn(config.delayWarning);

(async () => {
	const credentials = await authenticate();
	const ws = await createWebSocketConnection({});

	const ACCEPT_DELAY = config.acceptDelay > 10 ? 10 : config.acceptDelay;
	let MATCH_STATUS = "Invalid";
	let PLAYER_STATUS = "None";

	logger.log(config.ready);

	ws.subscribe(
		"/lol-lobby/v2/lobby/matchmaking/search-state",
		(data, event) => {
			const status = data.searchState; // Invalid | Searching | Found

			if (MATCH_STATUS == status) return; // Block spamming same status.
			console.clear();

			logger.log(config.searchStatus[status]);

			PLAYER_STATUS = "None";
			MATCH_STATUS = status;

			if (status == "Found") {
				setTimeout(async () => {
					if (PLAYER_STATUS == "Declined") return; // If match declined by user, don't send any request for it.

					await createHttp1Request(
						{
							method: "POST",
							url: "/lol-matchmaking/v1/ready-check/accept",
						},
						credentials
					) // Send accept match request to League Client
						.catch((err) => {
							logger.error(`${config.acceptError}\n${err}`);
						});
				}, ACCEPT_DELAY * 1e3);
			}
		}
	);

	ws.subscribe("/lol-matchmaking/v1/ready-check", (data, event) => {
		const response = data.playerResponse; // None | Accepted | Declined

		if (PLAYER_STATUS == response) return; // Block spamming same status.

		response == "None" || logger.warn(config.playerStatus[response]);
		PLAYER_STATUS = response;
	});
})();
