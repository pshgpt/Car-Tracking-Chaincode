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
				return await ctx.call("adapter.createUser", { userName: ctx.params.userName, orgName: ctx.params.orgName, roleValue: ctx.params.roleValue })
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
				const args = {
					docType: ctx.params.docType,
					carId: ctx.params.carId,
					manufacturer: ctx.params.manufacturer,
					model: ctx.params.model,
				}
				return await ctx.call("adapter.invoke", { fcn: "createCar", args: args, userName: ctx.params.userDetails.userName, orgName: ctx.params.userDetails.orgName })
			}
		},

		getCarById: {
			/** @param {Context} ctx  */
			async handler(ctx) {
				const args = {
					docType: ctx.params.docType,
					carId: ctx.params.carId,
				}
				return await ctx.call("adapter.query", { fcn: "getCarById", args: args, userName: ctx.params.userDetails.userName, orgName: ctx.params.userDetails.orgName })
			}
		},

		deliverToDealer: {
			/** @param {Context} ctx  */
			async handler(ctx) {
				const args = {
					carId: ctx.params.carId,
				}
				return await ctx.call("adapter.invoke", { fcn: "deliverToDealer", args: args, userName: ctx.params.userDetails.userName, orgName: ctx.params.userDetails.orgName })
			}
		},
		sellToCustomer: {
			/** @param {Context} ctx  */
			async handler(ctx) {
				const args = {
					carId: ctx.params.carId,
					owner: ctx.params.owner
				}
				return await ctx.call("adapter.invoke", { fcn: "sellToCustomer", args: args, userName: ctx.params.userDetails.userName, orgName: ctx.params.userDetails.orgName })
			}
		},
		getHistoryByCarId: {
			/** @param {Context} ctx  */
			async handler(ctx) {
				const args = {
					carId: ctx.params.carId,
				}
				return await ctx.call("adapter.query", { fcn: "getHistoryByCarId", args: args, userName: ctx.params.userDetails.userName, orgName: ctx.params.userDetails.orgName })
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
