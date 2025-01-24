Module.register("MMM-Yahrzeit", {
    defaults: {
        yahrzeits: [],
        title: "Upcoming Yahrzeits", // Title to show in the module header
        timezone: "America/New_York", // Specify the timezone
        showCount: 5, // Number of upcoming Yahrzeits to show
        daysAhead: 30, // Number of days in the future to consider
        useEllipsis: true, // Whether to use ellipsis for names that are too long
        maxCharactersInNameBeforeEllipsis: 15, // Maximum number of characters in the name before ellipsis is used
        showHebrewDate: false, // Whether to show Hebrew date in addition to English date
    },

    start: function() {
        var self = this
        this.yahrzeitData = [];
        this.getData();

        // update tasks every 600s
        var refreshFunction = function () {
            self.config['id'] = self.identifier;
            self.sendSocketNotification('GET_YAHRZEITS', self.config)
        }
        refreshFunction()
        setInterval(refreshFunction, 600000)
    },

    getData: function() {
        this.sendSocketNotification("GET_YAHRZEITS", this.config);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "YAHRZEIT_DATA") {
            this.yahrzeitData = payload;
            this.updateDom();
        }
    },

    getDom: function() {
        var wrapper = document.createElement("div");

        // Title
        var title = document.createElement("header");
        title.className = "module-header";
        title.innerHTML = this.config.title;
        wrapper.appendChild(title);
        var content = document.createElement("div");
        if (this.yahrzeitData.length > 0) {
            var table = document.createElement("table");
            var tbody = document.createElement("tbody");

            // Create table rows
            this.yahrzeitData.forEach(function(yahrzeit) {
                var row = document.createElement("tr");
                var nameCell = document.createElement("td");
                nameCell.innerHTML = yahrzeit.name;
                var dateCell = document.createElement("td");
                dateCell.innerHTML = yahrzeit.date;
                row.appendChild(nameCell);
                row.appendChild(dateCell);
                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            content.appendChild(table);
        } else {
            content.innerHTML = "None";
        }

        wrapper.appendChild(content);

        return wrapper;
    }
});
