"use strict";

const fetch = require('node-fetch');
const url = 'https://ftalphaville2-wp.ft.com/api/get_recent_posts/?post_type=team_member';

let cachedTeam;
let cachedNames;
let lastUpdate;

function fetchData () {
	return fetch(`${url}&api_key=${process.env['WP_API_KEY']}`)
		.then(res => res.json())
		.then(json => {
			if (json) {
				cachedTeam = json.posts;

				cachedNames = [];
				if (cachedTeam) {
					cachedTeam.forEach((obj) => {
						cachedNames.push({
							name: obj.title,
							slug: obj.slug
						});
					});
				}

				lastUpdate = new Date();
			}
		})
		.catch((e) => {
			console.log("Error fetching the team members", e);
		});
}

let teamMembersPromise = null;
exports.getTeamMembers = function () {
	if (teamMembersPromise) {
		return teamMembersPromise;
	} else {
		teamMembersPromise = new Promise((resolve, reject) => {
			if (lastUpdate && new Date().getTime() - lastUpdate.getTime() < 600000) {
				resolve(cachedTeam);
				teamMembersPromise = null;
			} else {
				fetchData().then(() => {
					resolve(cachedTeam);
					teamMembersPromise = null;
				}).catch((e) => {
					reject(e);
					teamMembersPromise = null;
				});
			}
		});
		return teamMembersPromise;
	}
};

let teamMemberNamesPromise = null;
exports.getTeamMemberNames = function () {
	if (teamMemberNamesPromise) {
		return teamMemberNamesPromise;
	} else {
		teamMemberNamesPromise = new Promise((resolve, reject) => {
			if (lastUpdate && new Date().getTime() - lastUpdate.getTime() < 600000) {
				resolve(cachedNames);
				teamMemberNamesPromise = null;
			} else {
				fetchData().then(() => {
					resolve(cachedNames);
					teamMemberNamesPromise = null;
				}).catch((e) => {
					reject(e);
					teamMemberNamesPromise = null;
				});
			}
		});
		return teamMemberNamesPromise;
	}
};
