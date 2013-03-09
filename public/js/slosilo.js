var MODELS = (function () {
    "use strict";
    ko.validation.init({
        errorMessageClass: 'help-inline'
    });

    function arrayFilter(coll, options) {
        options = options || {};
        options.excludeIfDeleted = options.excludeIfDeleted || true;
        options.filterByType = options.filterByType || false;
        return ko.computed(function () {
            return ko.utils.arrayFilter(coll(), function (item) {
                return (!options.excludeIfDeleted || item._deleted && !item._deleted()) && (!options.filterByType || item.type() === options.filterByType);
            });
        });
    }

    function iCanAddElementToCollection(self, options) {
        var settings = $.extend({}, options);
        if (!settings.ctor) {
            throw "no ctor provided";
        }
        if (!settings.coll) {
            throw "no coll provided";
        }
        // item and element are arguments provided
        // by the click binding
        return function (item, element) {
            var x = new settings.ctor();
            if (x.edit) {
                x.edit({
                    onRollback: function (item) {
                        settings.coll.remove(x);
                        if (settings.onRollback) {
                            settings.onRollback(x);
                        }
                    },
                    onCommit: function () {
                        if (settings.onCommit) {
                            settings.onCommit(x);
                        }
                    }
                });
            }
            settings.coll.push(x);
            if (settings.selected) {
                settings.selected(x);
            }
        };
    }
    // Refactor this horrible shit

    function addTransaction(self, options) {
        options = options || {};
        if (!options.noRemote) {
            self.serverSynched = ko.observable(true).extend({
                isTrue: true
            });
            self.isSyncing = ko.observable(false);
        }
        self.mode = ko.observable('view');
        ko.editable(self);
        self.edit = function (input) {
            self.beginEdit();
            self.commitChanges = function () {
                if (self.errors().length === 0) {
                    if (!options.noRemote) {
                        // push changes to server
                        var me = ko.mapping.toJSON(self);
                        self.isSyncing(true);
                        $.ajax({
                            dataType: 'json',
                            contentType: 'application/json',
                            type: 'POST',
                            url: self.resource(),
                            data: me,
                            success: function (data, status, jqXHR) {
                                self.isSyncing(false);
                                self.commit();
                                self.mode('view');
                                if (input && input.onCommit) {
                                    input.onCommit(self, data);
                                }
                            }
                        }).error(function () {
                            self.isSyncing(false);
                            self.serverSynched(false);
                            self.errors.showAllMessages();
                        });
                    } else {
                        self.commit();
                        self.mode('view');
                        if (input && input.onCommit) {
                            input.onCommit(self);
                        }
                    }
                } else {
                    self.errors.showAllMessages();
                    return false;
                }
            };
            self.rollbackChanges = function () {
                self.rollback();
                self.mode('view');
                if (input && input.onRollback) {
                    input.onRollback(self);
                }
            };
            self.mode('edit');
        };
    }

    function iHaveTemplate(self) {
        self.template = function (item, bindingContext) {
            return item ? item.template() : self.type() + '-' + self.mode();
        };
    }

    function iResource(self, parent) {
        self.resource = function () {
            return (parent ? parent.resource() + '/' : '/') + inflector.pluralize(self.type()) + '/' + self._id();
        };
    }

    function capitalize(input) {
        if (!input) {}
        return input[0].toUpperCase() + input.slice(1);
    }

    function initHelper(self, data, parent, simple, mapping) {
        var prop, sprop;
        if (simple) {
            for (prop in simple) {
                if (simple.hasOwnProperty(prop)) {
                    data[prop] = data[prop] || simple[prop];
                }
            }
        }
        mapping = mapping || {};
        if (simple) {
            for (prop in simple) {
                if (simple.hasOwnProperty(prop) && $.isArray(simple[prop]) && prop !== 'attributes') {
                    sprop = inflector.singularize(prop);
                    if (!sprop) {
                        sprop = prop;
                    }
                    sprop = capitalize(sprop);
                    if (!MODELS[sprop]) {
                        continue;
                    }
                    mapping[prop] = (function (constructor) {
                        return {
                            create: function (options) {
                                return new constructor(options.data, self);
                            }
                        };
                    })(MODELS[sprop]);
                }
            }
        }
        if (simple.attributes) {
            mapping.attributes = (function (constructor) {
                return {
                    create: function (options) {
                        return new constructor(options.data, self);
                    }
                };
            })(MODELS.Attribute);
        }
        ko.mapping.fromJS(data, mapping, self);
        self.errors = ko.validation.group(self);
        iResource(self, parent);
        iHaveTemplate(self);
        if (self.attributes) {
            self.addCustomAttribute = iCanAddElementToCollection(self, {
                coll: self.attributes,
                ctor: function () {
                    return new Attribute({
                        namespace: 'cstm'
                    });
                },
                lock: 'lockNewCustomAttributeCreation'
            });
            self.customAttributes = ko.computed(function () {
                return ko.utils.arrayFilter(self.attributes(), function (item) {
                    return !item._deleted() && item.namespace() === 'cstm';
                });
            });
        }
        if (simple) {
            for (prop in simple) {
                if (simple.hasOwnProperty(prop) && $.isArray(simple[prop]) && prop !== 'attributes') {
                    sprop = inflector.singularize(prop);
                    if (!sprop) {
                        sprop = prop;
                    }
                    sprop = capitalize(sprop);
                    self['available' + capitalize(prop)] = (function (collection) {
                        return arrayFilter(collection);
                    })(self[prop]);
                    if (!MODELS[sprop]) {
                        continue;
                    }
                    self['add' + sprop] = (function (collection, constructor) {
                        return iCanAddElementToCollection(self, {
                            coll: collection,
                            ctor: function () {
                                var x = new constructor({}, self);
                                return x;
                            },
                            lock: 'lockNew' + constructor.name + 'Creation'
                        });
                    })(self[prop], MODELS[sprop]);
                }
            }
        }
    }

    function Attribute(data) {
        var self = this;
        data = data || {};
        initHelper(self, data, null, {
            _id: uuid.v4(),
            type: 'attribute',
            _deleted: false,
            name: undefined,
            namespace: undefined,
            value: undefined
        }, null);
        addTransaction(self, {
            noRemote: true
        });
        self.remove = function (item) {
            item.edit();
            item._deleted(true);
            item.commitChanges();
        };
        self.template = function () {
            return self.type() + '-' + self.mode();
        };
    }

    function Change(data, parent) {
        var self = this;
        data = data || {};
        initHelper(self, data, parent, {
            _id: uuid.v4(),
            type: 'change',
            _deleted: false,
            value: undefined,
            from: undefined,
            to: undefined,
            created_at: undefined,
            created_by: undefined
        }, null);
        addTransaction(self);
        self.remove = function (item) {
            item.edit();
            item._deleted(true);
            item.commitChanges();
        };
        self.computedFrom = ko.computed({
            read: function () {
                var date = new Date(self.from() - 0);
                return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
            },
            write: function (value) {
                self.from(value.getTime());
            }
        });
        self.computedTo = ko.computed({
            read: function () {
                var date = new Date(self.to() - 0);
                return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
            },
            write: function (value) {
                self.to(value.getTime());
            }
        });
    }

    function Project(data) {
        var self = this;
        data = data || {};
        initHelper(self, data, null, {
            _id: uuid.v4(),
            type: 'project',
            _deleted: false,
            owner: undefined,
            isPublic: false,
            name: undefined,
            description: undefined,
            changes: []
        }, null);
        self.posibleStates = ko.observableArray([{
            name: 'not set',
            value: 0
        }, {
            name: 'open',
            value: 1
        }, {
            name: 'close',
            value: 2
        }, {
            name: 'on request',
            value: 3
        }]);
        self.computedState = function (val) {
            var i;
            for (i = 0; i < self.posibleStates().length; i++) {
                var data = self.posibleStates()[i];
                if (data.value === val) {
                    return data.name;
                }
            }
        };
        self.remove = function (item) {
            item.edit();
            item._deleted(true);
            item.commitChanges();
        };
        self.currentChanges = ko.computed(function () {
            return ko.utils.arrayFilter(self.changes(), function (item) {
                return (!item._deleted()) && item.created_at && item.created_at();
            });
        });
        self.pendantChanges = ko.computed(function () {
            return ko.utils.arrayFilter(self.changes(), function (item) {
                return (!item._deleted()) && (typeof item.created_at === 'undefined');
            });
        });
				addTransaction(self);
				
    }
    return {
        Attribute: Attribute,
        Change: Change,
        Project: Project
    };
})();
