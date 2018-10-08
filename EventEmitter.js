const showLogs = false; //just for testing. switch to false to turn off logs

//use this function to pass statuses for the event logger, useful for debugging
function logStuff(logStatement) {
    if (showLogs) {
        console.log(logStatement);
    }
}


/*
    This can be used for any situation where you need 2 or more components to pass data to eachother. This approach is simple, yet adequate for most needs and is very straight forward. The class should essentially be static, which means you never instantiate it (ex of what not to do: new EventEmitter())
    The proper way to use this component is to use the .on method to set up a listener for a certain custom event.
    When you want to fire an event you will use EventEmitter.emit('name-of-event'), and any corresponding listeners will fire
    Make sure you dispose of the listener when you dispose of a component that was using it or you will have memory leaks
 */
export class EventEmitter {

    static _listeners = {}; //this variable acts as a hash that stores all of our listeners with the key being the tag

    /*
    listeners object structure: {
         eventTag: {
            eventName : [{callback:callback1, id:callbackId}, {callback:callback2, id:callbackId}],
            eventName2: [{callback:callback3, id:callbackId}, {callback:callback4, id:callbackId}]
            },
         eventTag2: {
            eventName : [{callback:callback5, id:callbackId}, {callback:callback6, id:callbackId}]
            }
        }
     */

    /*
        This method sets up a custom event listener that will fire the callback when that event is emitted
            event: string - event name
            callback: function - fires when the event its listening for is emitted
            callbackId: string (optional) - Because you can have more than one call back inside a single listener we have the option to add an Id to the callback for removal purposes
            eventTag: string (optional) - used for an easy way to sort event listeners, generally going to be the default or the page/component name.
                Having a tag makes it easier to organize/cleanup/call only certain functions
     */
    static on(event, callback, eventTag = "general", callbackId = 'default') {

        logStuff(`creating listener for event: ${event} with tag: ${eventTag} and callbackId of ${callbackId}`);


        let listeners = EventEmitter._listeners;

        if (!listeners.hasOwnProperty(eventTag)) { //tag doesnt exist
            listeners[eventTag] = {};
        }

        if (!listeners[eventTag].hasOwnProperty(event)) { //if event name doesnt exist
            listeners[eventTag][event] = [];
        }

        listeners[eventTag][event].push({callback: callback, callbackId: callbackId});
    }

    /*
        This method removes all event listeners that correspond to the passed in parameters.
        If eventTag and callbackId are both null then it will remove all events with the corresponding name

            event: string - event name
            callbackId: string (optional) - If specified it will only remove events with this corresponding callbackId
            eventTag: string (optional) - If specified it will only remove events with the corresponding eventTag
     */

    static off(event, eventTag = null, callbackId = null) {
        logStuff(`removing ${event} listener with callbackId of ${callbackId} and tag of ${eventTag}`);

        const listeners = EventEmitter._listeners;
        let listenersCopy = JSON.parse(JSON.stringify(listeners));

        if (eventTag !== null && !listenersCopy.hasOwnProperty(eventTag)) {
            logStuff('event tag provided but not found... no listeners removed');
            return; //if eventag is specified but doesn't exist there's no matching listeners
        }

        let newStuff = {}; //this is the new listeners object we are going to build

        //loops over the listeners object and adds the events we want to keep to a new object
        for (let key in listenersCopy) { // key = eventTag, listenersCopy = listeners obj clone
            if (eventTag !== null && key === eventTag) {
                continue; // our new object doesnt want any listeners from the matching key
            }

            newStuff[key] = {}; //creating the the new key (eventTag) in our new object

            for (let listenerName in listenersCopy[key]) {
                if (listenerName !== event && callbackId == null) {
                    newStuff[key][listenerName] = listenersCopy[key][listenerName];
                } else if (listenerName !== event) {
                    newStuff[key][listenerName] = listenersCopy[key][listenerName.filter(obj => obj.callbackId !== callbackId)];
                }
            }
        }

        logStuff(`new listeners `, newStuff);

        EventEmitter._listeners = newStuff;
    }

    /*
        This method triggers the event passed, which in turn will trigger all the callbacks for whatever is listening

            event: string - event name
            data: any (optional) - data that needs to be passed back to the listener
            callbackId: string (optional) - If specified it will only trigger events with this id
            eventTag: string (optional) - If specified it will only trigger events with a matching evenTag
    */

    static emit(event, data = null, eventTag = null, callbackId = null) {
        logStuff(`firing '${event}' with data '${data}' and event tag '${eventTag}', and callbackid '${callbackId}'`);

        const listeners = EventEmitter._listeners;

        if (eventTag !== null && !listeners.hasOwnProperty(eventTag)) {
            logStuff('event tag provided but not found... no listeners triggered');
            return; //if eventag is specified but doesn't exist there's no matching listeners
        }

        let callbacksToFire = []; //array of the entire callback object: {callback: ()=>void, calllbackId: string}

        for (let key in listeners) {
            if (eventTag !== null && key !== eventTag) {
                continue; // if the eventTag is specified but doesn't match the key then we skip this loop
            }
            for (let listenerName in listeners[key]) {
                if (listenerName === event && callbackId == null) {
                    callbacksToFire = [...callbacksToFire, ...listeners[key][listenerName]];
                } else if(listenerName === event){
                    console.log(listeners[key][listenerName]);
                    callbacksToFire = [...callbacksToFire, ...listeners[key][listenerName].filter(obj => obj.callbackId === callbackId)];
                }
            }
        }

        logStuff('emitting ', callbacksToFire);

        for (let callbackObj of callbacksToFire) {
            callbackObj.callback(data);
        }
    }

    /*
        This method removes all listeners for a given eventTag
     */

    static removeAllForTag(eventTag) {
        logStuff(`removing all listeners with the event tag: ${eventTag}`);

        let listeners = EventEmitter._listeners;

        if (listeners.hasOwnProperty(eventTag)) {
            delete listeners[eventTag];
        } else {
            logStuff('error, no event listeners were found under this tag');
        }
    }

    /*
        This method removes all event emitter listeners
     */

    static removeAllListeners() {
        logStuff(`removing all listeners`);
        EventEmitter._listeners = {};
    }
}
