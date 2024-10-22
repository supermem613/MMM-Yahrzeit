const NodeHelper = require("node_helper");
const { HDate } = require("@hebcal/hdate");
const moment = require("moment-timezone");

module.exports = NodeHelper.create({
    start: function() {
        console.log("Starting node helper for: " + this.name);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "GET_YAHRZEITS") {
            this.getYahrzeits(payload);
        }
    },

    getYahrzeits: function(config) {
        const yahrzeits = config.yahrzeits.map(y => {
        
            const [day, rawHebrewMonth] = y.date.split(" ");
            const hebrewMonth = rawHebrewMonth.charAt(0).toUpperCase() + rawHebrewMonth.slice(1).toLowerCase();

            const hebrewMonths = ["Nisan", "Iyar", "Sivan", "Tammuz", "Av", "Elul", "Tishrei", "Cheshvan", "Kislev", "Tevet", "Shevat", "Adar", "Adar II"];
            const monthIndex = hebrewMonths.indexOf(hebrewMonth);
            if (monthIndex === -1) {
                console.error(`Invalid Hebrew month: ${hebrewMonth}`);
                return null;
            }
            y.date = `${day} ${monthIndex + 1}`;

            const currentHebrewYear = new HDate().getFullYear();
            const nextHebrewYear = currentHebrewYear + 1;
            const hebrewMonthIndex = hebrewMonths.indexOf(hebrewMonth);
            const today = new HDate();
            const isNextYear = (hebrewMonthIndex < hebrewMonths.indexOf("Nisan")) || (hebrewMonthIndex === hebrewMonths.indexOf("Nisan") && day <= today.getDate());
            const hebrewDate = new HDate(day, hebrewMonth, isNextYear ? nextHebrewYear : currentHebrewYear);
            const englishDate = hebrewDate.greg();

            let displayName = y.name;
            if (config.useEllipsis && displayName.length > config.maxCharactersInNameBeforeEllipsis) {
                displayName = displayName.substring(0, config.maxCharactersInNameBeforeEllipsis) + '...';
            }

            return {
                name: config.showHebrewDate ? `${displayName} (${day} ${rawHebrewMonth})` : displayName,
                date: moment(englishDate).tz(config.timezone).format('MMMM Do YYYY'),
            };
        }).filter(y => y !== null);

        const today = moment().tz(config.timezone);
        const daysAhead = config.daysAhead || 30;

        const filteredYahrzeits = yahrzeits.filter(y => {
            const yahrzeitDate = moment(y.date, 'MMMM Do YYYY').tz(config.timezone);
            const diffDays = yahrzeitDate.diff(today, 'days');
            return diffDays >= 0 && diffDays <= daysAhead;
        });

        const sortedYahrzeits = filteredYahrzeits.sort((a, b) => {
            const dateA = moment(a.date, 'MMMM Do YYYY').tz(config.timezone);
            const dateB = moment(b.date, 'MMMM Do YYYY').tz(config.timezone);
            const diffA = dateA.diff(today, 'days');
            const diffB = dateB.diff(today, 'days');
            return diffA - diffB;
        }).slice(0, config.showCount);

        const formattedYahrzeits = sortedYahrzeits.map(y => {
            const yahrzeitDate = moment(y.date, 'MMMM Do YYYY').tz(config.timezone);
            const today = moment().tz(config.timezone);
            const diffDays = yahrzeitDate.diff(today, 'days');
            const startingDate = yahrzeitDate.clone().subtract(1, 'days');

            let formattedDate;
            const todayDate = today.date();
            const yahrzeitDay = yahrzeitDate.date();

            if (yahrzeitDay === todayDate) {
                formattedDate = "Today";
            } else if (yahrzeitDay === todayDate + 1) {
                formattedDate = "Tonight / Tomorrow";
            } else if (diffDays > 1 && diffDays <= 7) {
                formattedDate =  startingDate.format('dddd') + " / " + yahrzeitDate.format('dddd');
            } else {
                formattedDate =  startingDate.format('MMM Do') + " / " + yahrzeitDate.format('Do');
            }

            return {
                name: y.name,
                date: formattedDate
            };
        });

        this.sendSocketNotification("YAHRZEIT_DATA", formattedYahrzeits);
    }
});