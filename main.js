"use strict";

const fetch = require('node-fetch');
const _ = require('lodash');

const paulSlug = 'paul-murphy';
const url = `${process.env.PROD_WP_URL}/api/get_recent_posts/?post_type=team_member`;

let cachedTeam;
let cachedNames;
let lastUpdate;


const orderTeam = (team) => {
	team = _.orderBy(team, ['slug']);

	let paul;
	let paulIndex;

	team.forEach((tm, index) => {
		if(tm.slug === paulSlug) {
			paul = tm;
			paulIndex = index;
		}
	});
	return [
		paul,
		...team.slice(0, paulIndex),
		...team.slice(paulIndex+1)
	];
};

function fetchData () {
	return fetch(`${url}&api_key=${process.env['WP_API_KEY']}`)
		.then(res => res.json())
		.then(json => {
			if (json) {
				cachedTeam = orderTeam(json.posts);

				cachedNames = [];
				if (cachedTeam) {
					cachedTeam.forEach((obj) => {
						obj.headshotUrl = `https://www.ft.com/__origami/service/image/v2/images/raw/fthead:${obj.slug}?source=alphaville`;

						cachedNames.push({
							name: obj.title,
							slug: obj.slug,
							headshotUrl: obj.headshotUrl
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
let teamMembersInProgress = false;
exports.getMembers = function () {
	if (teamMembersInProgress) {
		return teamMembersPromise;
	} else {
		teamMembersInProgress = true;
		teamMembersPromise = new Promise((resolve, reject) => {
			if (lastUpdate && new Date().getTime() - lastUpdate.getTime() < 600000) {
				resolve(cachedTeam);
				teamMembersInProgress = false;
			} else {
				fetchData().then(() => {
					resolve(cachedTeam);
					teamMembersInProgress = false;
				}).catch((e) => {
					if (cachedTeam) {
						resolve(cachedTeam);
						teamMembersInProgress = false;
					} else {
						reject(e);
						teamMembersInProgress = false;
					}
				});
			}
		});
		return teamMembersPromise;
	}
};

let teamMemberNamesPromise = null;
let teamMemberNamesInProgress = false;
exports.getMemberNames = function () {
	if (teamMemberNamesInProgress) {
		return teamMemberNamesPromise;
	} else {
		teamMemberNamesInProgress = true;
		teamMemberNamesPromise = new Promise((resolve, reject) => {
			if (lastUpdate && new Date().getTime() - lastUpdate.getTime() < 600000) {
				teamMemberNamesInProgress = false;
				resolve(cachedNames);
			} else {
				fetchData().then(() => {
					teamMemberNamesInProgress = false;
					resolve(cachedNames);
				}).catch((e) => {
					if (cachedNames) {
						teamMemberNamesInProgress = false;
						resolve(cachedNames);
					} else {
						teamMemberNamesInProgress = false;
						reject(e);
					}
				});
			}
		});
		return teamMemberNamesPromise;
	}
};
