"use strict";

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: "car",

	/**
	 * Settings
	 */
	settings: {

	},

	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {

		/**
		 * Say a 'Hello' action.
		 *
		 * @returns
		 */
		createUser: {

			async handler(ctx) {
				let response = await ctx.call("adapter.createUser", { userName: ctx.params.userName, orgName: ctx.params.orgName })
				if (response != null) {
					return response;
				}
			}
		},

		/**
		 * Welcome, a username
		 *
		 * @param {String} name - User name
		 */
		createCar: {
			/** @param {Context} ctx  */
			async handler(ctx) {
				let args = {
					docType: ctx.params.docType,
					carId: ctx.params.carId,
					manufacturer: ctx.params.manufacturer,
					model: ctx.params.model,
				}
				let response = await ctx.call("adapter.invoke", { fcn: "createCar", args: args, userName: ctx.params.userDetails.userName, orgName: ctx.params.userDetails.orgName })
				if (response != null) {
					return response;
				}
			}
		},

		getCarById: {
			/** @param {Context} ctx  */
			async handler(ctx) {
				let args = {
					docType: ctx.params.docType,
					carId: ctx.params.carId,
				}
				let response = await ctx.call("adapter.query", { fcn: "getCarById", args: args, userName: ctx.params.userDetails.userName, orgName: ctx.params.userDetails.orgName })
				if (response != null) {
					return response;
				}
			}
		},

		deliverToDealer: {
			/** @param {Context} ctx  */
			async handler(ctx) {
				let args = {
					carId: ctx.params.carId,
				}
				let response = await ctx.call("adapter.invoke", { fcn: "deliverToDealer", args: args, userName: ctx.params.userDetails.userName, orgName: ctx.params.userDetails.orgName })
				if (response != null) {
					return response;
				}
			}
		},
		sellToCustomer: {
			/** @param {Context} ctx  */
			async handler(ctx) {
				let args = {
					carId: ctx.params.carId,
					owner: ctx.params.owner
				}
				let response = await ctx.call("adapter.invoke", { fcn: "sellToCustomer", args: args, userName: ctx.params.userDetails.userName, orgName: ctx.params.userDetails.orgName })
				if (response != null) {
					return response;
				}
			}
		},
		getHistoryByCarId: {
			/** @param {Context} ctx  */
			async handler(ctx) {
				let args = {
					carId: ctx.params.carId,
				}
				let response = await ctx.call("adapter.query", { fcn: "getHistoryByCarId", args: args, userName: ctx.params.userDetails.userName, orgName: ctx.params.userDetails.orgName })
				if (response != null) {
					return response;
				}
			}
		}

	},

	/**
	 * Events
	 */
	events: {

	},

	/**
	 * Methods
	 */
	methods: {

	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {

	},

	/**
	 * Service started lifecycle event handler
	 */
	async started() {

	},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {

	}
};
