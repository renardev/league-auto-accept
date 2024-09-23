const {
	authenticate,
	createWebSocketConnection,
	createHttp1Request,
} = require("league-connect");
const moment = require("moment");
const config = require("./config.json");

(async () => {
	const credentials = await authenticate();
	const ws = await createWebSocketConnection({});

	let MATCH_FOUND = false;
	let PLAYER_STATUS = "None";

	console.log(config.ready);

	ws.subscribe(
		"/lol-lobby/v2/lobby/matchmaking/search-state",
		(data, event) => {
			const status = data.searchState;

			if (MATCH_FOUND) return;

			console.log(config.searchStatus[status]);

            if (status == 'Invalid')
                console.clear();

			if (status == "Found") {
				MATCH_FOUND = true;

				setTimeout(async () => {
					if (declined) return;

					await createHttp1Request(
						{
							method: "POST",
							url: "/lol-matchmaking/v1/ready-check/accept",
						},
						credentials
					);

					MATCH_FOUND = false;
					PLAYER_STATUS = "None";
				}, config.acceptDelay * 1e3);
			}
		}
	);

	ws.subscribe("/lol-matchmaking/v1/ready-check", (data, event) => {
		const response = data.playerResponse;

		if (response == "None" || PLAYER_STATUS != "None") return;

		console.log(config.playerStatus[response]);
		PLAYER_STATUS = response;
	});
})();

process.on("unhandledRejection", async (err, promise) => {
	console.error(
		`[ANTI-CRASH - ${moment().format(
			"DD MM YYYY hh:mm:ss"
		)}]: Unhandled Rejection: ${err}`
	);
	console.error(promise);
});
