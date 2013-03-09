(function (MODELS) {
    MODELS.PROJECT = {
        dayTicks: 24 * 60 * 60 * 1000,
        reverseSearchForValue: function (items) {
            return function (now) {
                var i = items.length,
                    c;
                while (i--) {
                    c = items[i];
                    if (now >= c.from() && now <= c.to()) {
                        return c.value();
                    }
                }
                return 0;
            };
        },
        groupByMonth: function (items) {
            if (!items || !items.length) {
                return;
            }
            var f = function (item) {
                    return item.date.getMonth() + 1;
                },
                c = f(items[0]),
                i, j, ret = [],
                len = items.length,
                epoch;
            epoch = items[0].date;
            for (j = 0, i = 0; i < len; i++) {
                if (f(items[i]) !== c) {
                    ret.push({
                        time: epoch,
                        days: items.slice(j, i)
                    });
                    epoch = items[i].date;
                    c = f(items[i]);
                    j = i;
                }
            }
            ret.push({
                time: epoch,
                days: items.slice(j, i)
            });
            return ret;
        },
        monthArray: function () {
            var ret = [],
                i, monthCollection = 'JFMAMJJASOND';
            for (i = 0; i < monthCollection.length; i++) {
                ret.push({
                    value: i,
                    text: monthCollection[i]
                });
            }
            return ret;
        },
        timeWindowValues: function () {
            var i, ret = [];
            for (i = 1; i < 12; i++) {
                ret.push({
                    text: i + ' month',
                    value: i
                });
            }
            ret.push({
                text: 'one year',
                value: 12
            });
            ret.push({
                text: 'two year',
                value: 24
            });
            return ret;
        },
        calendar: function () {
            var from = this.from().getTime(),
                to = this.to().getTime(),
                items = this.changes(),
                findFirst = MODELS.PROJECT.reverseSearchForValue(items),
                ret = [],
                dayTicks = MODELS.PROJECT.dayTicks;
            for (; from < to; from += dayTicks) {
                ret.push({
                    value: findFirst(from),
                    date: new Date(from)
                });
            }
            return MODELS.PROJECT.groupByMonth(ret);
        },
        extendProject: function (that) {
            var cal = this.calendar,
                now = new Date(),
                i, nowMonth = now.getMonth();
            // years
            that.fromYearValues = ko.observableArray([now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]);
            that.selectedYear = ko.observable(that.fromYearValues()[1]);
            // month
            that.fromMonthValues = ko.observableArray(MODELS.PROJECT.monthArray());
            that.selectedMonth = ko.observable(that.fromMonthValues()[nowMonth]);
            that.setSelectedMonth = function (val) {
                that.selectedMonth(val);
            };
            // from
            that.from = ko.computed(function () {
                var ret = new Date(that.selectedYear(), that.selectedMonth().value, 1);
                return ret;
            });
            // time window
            that.timeWindow = ko.observableArray(MODELS.PROJECT.timeWindowValues());
            that.selectedTimeWindow = ko.observable(that.timeWindow()[4]);
            // to
            that.to = ko.computed(function () {
                var ret = new Date(that.from().getTime()),
                    myWindow = that.selectedTimeWindow().value;
                ret.setMonth(ret.getMonth() + myWindow);
                return ret;
            });
            that.calendar = ko.computed(function () {
                return cal.call(that);
            });
            that.monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        }
    };
})(window.MODELS);
