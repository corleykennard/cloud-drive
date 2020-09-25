function noop() { }
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function add_location(element, file, line, column, char) {
    element.__svelte_meta = {
        loc: { file, line, column, char }
    };
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}
function validate_store(store, name) {
    if (store != null && typeof store.subscribe !== 'function') {
        throw new Error(`'${name}' is not a store with a 'subscribe' method`);
    }
}
function subscribe(store, ...callbacks) {
    if (store == null) {
        return noop;
    }
    const unsub = store.subscribe(...callbacks);
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function component_subscribe(component, store, callback) {
    component.$$.on_destroy.push(subscribe(store, callback));
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function custom_event(type, detail) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, false, false, detail);
    return e;
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error(`Function called outside component initialization`);
    return current_component;
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
    get_current_component().$$.after_update.push(fn);
}
function createEventDispatcher() {
    const component = get_current_component();
    return (type, detail) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
            // TODO are there situations where events could be dispatched
            // in a server (non-DOM) environment?
            const event = custom_event(type, detail);
            callbacks.slice().forEach(fn => {
                fn.call(component, event);
            });
        }
    };
}
// TODO figure out if we still want to support
// shorthand events, or if we want to implement
// a real bubbling mechanism
function bubble(component, event) {
    const callbacks = component.$$.callbacks[event.type];
    if (callbacks) {
        callbacks.slice().forEach(fn => fn(event));
    }
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function tick() {
    schedule_update();
    return resolved_promise;
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
let flushing = false;
const seen_callbacks = new Set();
function flush() {
    if (flushing)
        return;
    flushing = true;
    do {
        // first, call beforeUpdate functions
        // and update components
        for (let i = 0; i < dirty_components.length; i += 1) {
            const component = dirty_components[i];
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    flushing = false;
    seen_callbacks.clear();
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}

const globals = (typeof window !== 'undefined'
    ? window
    : typeof globalThis !== 'undefined'
        ? globalThis
        : global);

function get_spread_update(levels, updates) {
    const update = {};
    const to_null_out = {};
    const accounted_for = { $$scope: 1 };
    let i = levels.length;
    while (i--) {
        const o = levels[i];
        const n = updates[i];
        if (n) {
            for (const key in o) {
                if (!(key in n))
                    to_null_out[key] = 1;
            }
            for (const key in n) {
                if (!accounted_for[key]) {
                    update[key] = n[key];
                    accounted_for[key] = 1;
                }
            }
            levels[i] = n;
        }
        else {
            for (const key in o) {
                accounted_for[key] = 1;
            }
        }
    }
    for (const key in to_null_out) {
        if (!(key in update))
            update[key] = undefined;
    }
    return update;
}
function get_spread_object(spread_props) {
    return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
}
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const prop_values = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, prop_values, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

function dispatch_dev(type, detail) {
    document.dispatchEvent(custom_event(type, Object.assign({ version: '3.26.0' }, detail)));
}
function append_dev(target, node) {
    dispatch_dev("SvelteDOMInsert", { target, node });
    append(target, node);
}
function insert_dev(target, node, anchor) {
    dispatch_dev("SvelteDOMInsert", { target, node, anchor });
    insert(target, node, anchor);
}
function detach_dev(node) {
    dispatch_dev("SvelteDOMRemove", { node });
    detach(node);
}
function attr_dev(node, attribute, value) {
    attr(node, attribute, value);
    if (value == null)
        dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
    else
        dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
}
function set_data_dev(text, data) {
    data = '' + data;
    if (text.wholeText === data)
        return;
    dispatch_dev("SvelteDOMSetData", { node: text, data });
    text.data = data;
}
function validate_each_argument(arg) {
    if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
        let msg = '{#each} only iterates over array-like objects.';
        if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
            msg += ' You can use a spread to convert this iterable into an array.';
        }
        throw new Error(msg);
    }
}
function validate_slots(name, slot, keys) {
    for (const slot_key of Object.keys(slot)) {
        if (!~keys.indexOf(slot_key)) {
            console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
        }
    }
}
class SvelteComponentDev extends SvelteComponent {
    constructor(options) {
        if (!options || (!options.target && !options.$$inline)) {
            throw new Error(`'target' is a required option`);
        }
        super();
    }
    $destroy() {
        super.$destroy();
        this.$destroy = () => {
            console.warn(`Component was already destroyed`); // eslint-disable-line no-console
        };
    }
    $capture_state() { }
    $inject_state() { }
}

/**
 * @typedef {Object} WrappedComponent
 * @property {SvelteComponent} component - Component to load (this is always asynchronous)
 * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
 * @property {Object} [props] - Optional dictionary of static props
 * @property {Object} [userData] - Optional user data dictionary
 * @property {bool} _sveltesparouter - Internal flag; always set to true
 */

/**
 * @callback RoutePrecondition
 * @param {RouteDetail} detail - Route detail object
 * @returns {boolean} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
 */

/**
 * @typedef {Object} WrapOptions
 * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
 * @property {function(): Promise<SvelteComponent>} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
 * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
 * @property {Object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
 * @property {Object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
 * @property {Object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
 * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
 */

/**
 * Wraps a component to enable multiple capabilities:
 * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
 * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
 * 3. Adding static props that are passed to the component
 * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
 * 
 * @param {WrapOptions} args - Arguments object
 * @returns {WrappedComponent} Wrapped component
 */
function wrap(args) {
    if (!args) {
        throw Error('Parameter args is required')
    }

    // We need to have one and only one of component and asyncComponent
    // This does a "XNOR"
    if (!args.component == !args.asyncComponent) {
        throw Error('One and only one of component and asyncComponent is required')
    }

    // If the component is not async, wrap it into a function returning a Promise
    if (args.component) {
        args.asyncComponent = () => Promise.resolve(args.component);
    }

    // Parameter asyncComponent and each item of conditions must be functions
    if (typeof args.asyncComponent != 'function') {
        throw Error('Parameter asyncComponent must be a function')
    }
    if (args.conditions) {
        // Ensure it's an array
        if (!Array.isArray(args.conditions)) {
            args.conditions = [args.conditions];
        }
        for (let i = 0; i < args.conditions.length; i++) {
            if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                throw Error('Invalid parameter conditions[' + i + ']')
            }
        }
    }

    // Check if we have a placeholder component
    if (args.loadingComponent) {
        args.asyncComponent.loading = args.loadingComponent;
        args.asyncComponent.loadingParams = args.loadingParams || undefined;
    }

    // Returns an object that contains all the functions to execute too
    // The _sveltesparouter flag is to confirm the object was created by this router
    const obj = {
        component: args.asyncComponent,
        userData: args.userData,
        conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
        props: (args.props && Object.keys(args.props).length) ? args.props : {},
        _sveltesparouter: true
    };

    return obj
}

const subscriber_queue = [];
/**
 * Creates a `Readable` store that allows reading by subscription.
 * @param value initial value
 * @param {StartStopNotifier}start start and stop notifications for subscriptions
 */
function readable(value, start) {
    return {
        subscribe: writable(value, start).subscribe
    };
}
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = [];
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                const run_queue = !subscriber_queue.length;
                for (let i = 0; i < subscribers.length; i += 1) {
                    const s = subscribers[i];
                    s[1]();
                    subscriber_queue.push(s, value);
                }
                if (run_queue) {
                    for (let i = 0; i < subscriber_queue.length; i += 2) {
                        subscriber_queue[i][0](subscriber_queue[i + 1]);
                    }
                    subscriber_queue.length = 0;
                }
            }
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.push(subscriber);
        if (subscribers.length === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            const index = subscribers.indexOf(subscriber);
            if (index !== -1) {
                subscribers.splice(index, 1);
            }
            if (subscribers.length === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}
function derived(stores, fn, initial_value) {
    const single = !Array.isArray(stores);
    const stores_array = single
        ? [stores]
        : stores;
    const auto = fn.length < 2;
    return readable(initial_value, (set) => {
        let inited = false;
        const values = [];
        let pending = 0;
        let cleanup = noop;
        const sync = () => {
            if (pending) {
                return;
            }
            cleanup();
            const result = fn(single ? values[0] : values, set);
            if (auto) {
                set(result);
            }
            else {
                cleanup = is_function(result) ? result : noop;
            }
        };
        const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
            values[i] = value;
            pending &= ~(1 << i);
            if (inited) {
                sync();
            }
        }, () => {
            pending |= (1 << i);
        }));
        inited = true;
        sync();
        return function stop() {
            run_all(unsubscribers);
            cleanup();
        };
    });
}

function regexparam (str, loose) {
	if (str instanceof RegExp) return { keys:false, pattern:str };
	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
	arr[0] || arr.shift();

	while (tmp = arr.shift()) {
		c = tmp[0];
		if (c === '*') {
			keys.push('wild');
			pattern += '/(.*)';
		} else if (c === ':') {
			o = tmp.indexOf('?', 1);
			ext = tmp.indexOf('.', 1);
			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
		} else {
			pattern += '/' + tmp;
		}
	}

	return {
		keys: keys,
		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
	};
}

/* home/svelte-spa-router/Router.svelte generated by Svelte v3.26.0 */

const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

// (209:4) {:else}
function create_else_block(ctx) {
	let switch_instance;
	let switch_instance_anchor;
	let current;
	const switch_instance_spread_levels = [/*props*/ ctx[2]];
	var switch_value = /*component*/ ctx[0];

	function switch_props(ctx) {
		let switch_instance_props = {};

		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
		}

		return {
			props: switch_instance_props,
			$$inline: true
		};
	}

	if (switch_value) {
		switch_instance = new switch_value(switch_props());
		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
	}

	const block = {
		c: function create() {
			if (switch_instance) create_component(switch_instance.$$.fragment);
			switch_instance_anchor = empty();
		},
		m: function mount(target, anchor) {
			if (switch_instance) {
				mount_component(switch_instance, target, anchor);
			}

			insert_dev(target, switch_instance_anchor, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const switch_instance_changes = (dirty & /*props*/ 4)
			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
			: {};

			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;

					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});

					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props());
					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
					create_component(switch_instance.$$.fragment);
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
				} else {
					switch_instance = null;
				}
			} else if (switch_value) {
				switch_instance.$set(switch_instance_changes);
			}
		},
		i: function intro(local) {
			if (current) return;
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(switch_instance_anchor);
			if (switch_instance) destroy_component(switch_instance, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block.name,
		type: "else",
		source: "(209:4) {:else}",
		ctx
	});

	return block;
}

// (202:4) {#if componentParams}
function create_if_block(ctx) {
	let switch_instance;
	let switch_instance_anchor;
	let current;
	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
	var switch_value = /*component*/ ctx[0];

	function switch_props(ctx) {
		let switch_instance_props = {};

		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
		}

		return {
			props: switch_instance_props,
			$$inline: true
		};
	}

	if (switch_value) {
		switch_instance = new switch_value(switch_props());
		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
	}

	const block = {
		c: function create() {
			if (switch_instance) create_component(switch_instance.$$.fragment);
			switch_instance_anchor = empty();
		},
		m: function mount(target, anchor) {
			if (switch_instance) {
				mount_component(switch_instance, target, anchor);
			}

			insert_dev(target, switch_instance_anchor, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
			? get_spread_update(switch_instance_spread_levels, [
					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
				])
			: {};

			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;

					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});

					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props());
					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
					create_component(switch_instance.$$.fragment);
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
				} else {
					switch_instance = null;
				}
			} else if (switch_value) {
				switch_instance.$set(switch_instance_changes);
			}
		},
		i: function intro(local) {
			if (current) return;
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(switch_instance_anchor);
			if (switch_instance) destroy_component(switch_instance, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block.name,
		type: "if",
		source: "(202:4) {#if componentParams}",
		ctx
	});

	return block;
}

function create_fragment(ctx) {
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	const if_block_creators = [create_if_block, create_else_block];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*componentParams*/ ctx[1]) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	const block = {
		c: function create() {
			if_block.c();
			if_block_anchor = empty();
		},
		l: function claim(nodes) {
			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			if_blocks[current_block_type_index].m(target, anchor);
			insert_dev(target, if_block_anchor, anchor);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}

				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},
		d: function destroy(detaching) {
			if_blocks[current_block_type_index].d(detaching);
			if (detaching) detach_dev(if_block_anchor);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function wrap$1(component, userData, ...conditions) {
	// Use the new wrap method and show a deprecation warning
	// eslint-disable-next-line no-console
	console.warn("Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading");

	return wrap({ component, userData, conditions });
}

/**
 * @typedef {Object} Location
 * @property {string} location - Location (page/view), for example `/book`
 * @property {string} [querystring] - Querystring from the hash, as a string not parsed
 */
/**
 * Returns the current location from the hash.
 *
 * @returns {Location} Location object
 * @private
 */
function getLocation() {
	const hashPosition = window.location.href.indexOf("#/");

	let location = hashPosition > -1
	? window.location.href.substr(hashPosition + 1)
	: "/";

	// Check if there's a querystring
	const qsPosition = location.indexOf("?");

	let querystring = "";

	if (qsPosition > -1) {
		querystring = location.substr(qsPosition + 1);
		location = location.substr(0, qsPosition);
	}

	return { location, querystring };
}

const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
function start(set) {
	set(getLocation());

	const update = () => {
		set(getLocation());
	};

	window.addEventListener("hashchange", update, false);

	return function stop() {
		window.removeEventListener("hashchange", update, false);
	};
});

const location = derived(loc, $loc => $loc.location);
const querystring = derived(loc, $loc => $loc.querystring);

async function push(location) {
	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
		throw Error("Invalid parameter location");
	}

	// Execute this code when the current call stack is complete
	await tick();

	// Note: this will include scroll state in history even when restoreScrollState is false
	history.replaceState(
		{
			scrollX: window.scrollX,
			scrollY: window.scrollY
		},
		undefined,
		undefined
	);

	window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
}

async function pop() {
	// Execute this code when the current call stack is complete
	await tick();

	window.history.back();
}

async function replace(location) {
	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
		throw Error("Invalid parameter location");
	}

	// Execute this code when the current call stack is complete
	await tick();

	const dest = (location.charAt(0) == "#" ? "" : "#") + location;

	try {
		window.history.replaceState(undefined, undefined, dest);
	} catch(e) {
		// eslint-disable-next-line no-console
		console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
	}

	// The method above doesn't trigger the hashchange event, so let's do that manually
	window.dispatchEvent(new Event("hashchange"));
}

function link(node, hrefVar) {
	// Only apply to <a> tags
	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
		throw Error("Action \"link\" can only be used with <a> tags");
	}

	updateLink(node, hrefVar || node.getAttribute("href"));

	return {
		update(updated) {
			updateLink(node, updated);
		}
	};
}

// Internal function used by the link function
function updateLink(node, href) {
	// Destination must start with '/'
	if (!href || href.length < 1 || href.charAt(0) != "/") {
		throw Error("Invalid value for \"href\" attribute: " + href);
	}

	// Add # to the href attribute
	node.setAttribute("href", "#" + href);

	node.addEventListener("click", scrollstateHistoryHandler);
}

/**
 * The handler attached to an anchor tag responsible for updating the
 * current history state with the current scroll state
 *
 * @param {HTMLElementEventMap} event - an onclick event attached to an anchor tag
 */
function scrollstateHistoryHandler(event) {
	// Prevent default anchor onclick behaviour
	event.preventDefault();

	const href = event.currentTarget.getAttribute("href");

	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
	history.replaceState(
		{
			scrollX: window.scrollX,
			scrollY: window.scrollY
		},
		undefined,
		undefined
	);

	// This will force an update as desired, but this time our scroll state will be attached
	window.location.hash = href;
}

function instance($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Router", slots, []);
	let { routes = {} } = $$props;
	let { prefix = "" } = $$props;
	let { restoreScrollState = false } = $$props;

	/**
 * Container for a route: path, component
 */
	class RouteItem {
		/**
 * Initializes the object and creates a regular expression from the path, using regexparam.
 *
 * @param {string} path - Path to the route (must start with '/' or '*')
 * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
 */
		constructor(path, component) {
			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
				throw Error("Invalid component object");
			}

			// Path must be a regular or expression, or a string starting with '/' or '*'
			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
				throw Error("Invalid value for \"path\" argument");
			}

			const { pattern, keys } = regexparam(path);
			this.path = path;

			// Check if the component is wrapped and we have conditions
			if (typeof component == "object" && component._sveltesparouter === true) {
				this.component = component.component;
				this.conditions = component.conditions || [];
				this.userData = component.userData;
				this.props = component.props || {};
			} else {
				// Convert the component to a function that returns a Promise, to normalize it
				this.component = () => Promise.resolve(component);

				this.conditions = [];
				this.props = {};
			}

			this._pattern = pattern;
			this._keys = keys;
		}

		/**
 * Checks if `path` matches the current route.
 * If there's a match, will return the list of parameters from the URL (if any).
 * In case of no match, the method will return `null`.
 *
 * @param {string} path - Path to test
 * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
 */
		match(path) {
			// If there's a prefix, remove it before we run the matching
			if (prefix) {
				if (typeof prefix == "string" && path.startsWith(prefix)) {
					path = path.substr(prefix.length) || "/";
				} else if (prefix instanceof RegExp) {
					const match = path.match(prefix);

					if (match && match[0]) {
						path = path.substr(match[0].length) || "/";
					}
				}
			}

			// Check if the pattern matches
			const matches = this._pattern.exec(path);

			if (matches === null) {
				return null;
			}

			// If the input was a regular expression, this._keys would be false, so return matches as is
			if (this._keys === false) {
				return matches;
			}

			const out = {};
			let i = 0;

			while (i < this._keys.length) {
				// In the match parameters, URL-decode all values
				try {
					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || "") || null;
				} catch(e) {
					out[this._keys[i]] = null;
				}

				i++;
			}

			return out;
		}

		/**
 * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
 * @typedef {Object} RouteDetail
 * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
 * @property {string} location - Location path
 * @property {string} querystring - Querystring from the hash
 * @property {Object} [userData] - Custom data passed by the user
 * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
 * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
 */
		/**
 * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
 * 
 * @param {RouteDetail} detail - Route detail
 * @returns {bool} Returns true if all the conditions succeeded
 */
		async checkConditions(detail) {
			for (let i = 0; i < this.conditions.length; i++) {
				if (!await this.conditions[i](detail)) {
					return false;
				}
			}

			return true;
		}
	}

	// Set up all routes
	const routesList = [];

	if (routes instanceof Map) {
		// If it's a map, iterate on it right away
		routes.forEach((route, path) => {
			routesList.push(new RouteItem(path, route));
		});
	} else {
		// We have an object, so iterate on its own properties
		Object.keys(routes).forEach(path => {
			routesList.push(new RouteItem(path, routes[path]));
		});
	}

	// Props for the component to render
	let component = null;

	let componentParams = null;
	let props = {};

	// Event dispatcher from Svelte
	const dispatch = createEventDispatcher();

	// Just like dispatch, but executes on the next iteration of the event loop
	async function dispatchNextTick(name, detail) {
		// Execute this code when the current call stack is complete
		await tick();

		dispatch(name, detail);
	}

	// If this is set, then that means we have popped into this var the state of our last scroll position
	let previousScrollState = null;

	if (restoreScrollState) {
		window.addEventListener("popstate", event => {
			// If this event was from our history.replaceState, event.state will contain
			// our scroll history. Otherwise, event.state will be null (like on forward
			// navigation)
			if (event.state && event.state.scrollY) {
				previousScrollState = event.state;
			} else {
				previousScrollState = null;
			}
		});

		afterUpdate(() => {
			// If this exists, then this is a back navigation: restore the scroll position
			if (previousScrollState) {
				window.scrollTo(previousScrollState.scrollX, previousScrollState.scrollY);
			} else {
				// Otherwise this is a forward navigation: scroll to top
				window.scrollTo(0, 0);
			}
		});
	}

	// Always have the latest value of loc
	let lastLoc = null;

	// Current object of the component loaded
	let componentObj = null;

	// Handle hash change events
	// Listen to changes in the $loc store and update the page
	// Do not use the $: syntax because it gets triggered by too many things
	loc.subscribe(async newLoc => {
		lastLoc = newLoc;

		// Find a route matching the location
		let i = 0;

		while (i < routesList.length) {
			const match = routesList[i].match(newLoc.location);

			if (!match) {
				i++;
				continue;
			}

			const detail = {
				route: routesList[i].path,
				location: newLoc.location,
				querystring: newLoc.querystring,
				userData: routesList[i].userData
			};

			// Check if the route can be loaded - if all conditions succeed
			if (!await routesList[i].checkConditions(detail)) {
				// Don't display anything
				$$invalidate(0, component = null);

				componentObj = null;

				// Trigger an event to notify the user, then exit
				dispatchNextTick("conditionsFailed", detail);

				return;
			}

			// Trigger an event to alert that we're loading the route
			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
			dispatchNextTick("routeLoading", Object.assign({}, detail));

			// If there's a component to show while we're loading the route, display it
			const obj = routesList[i].component;

			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
			if (componentObj != obj) {
				if (obj.loading) {
					$$invalidate(0, component = obj.loading);
					$$invalidate(1, componentParams = obj.loadingParams);
					$$invalidate(2, props = {});

					// Trigger the routeLoaded event for the loading component
					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
					dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));
				} else {
					$$invalidate(0, component = null);
				}

				// Invoke the Promise
				const loaded = await obj();

				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
				if (newLoc != lastLoc) {
					// Don't update the component, just exit
					return;
				}

				// If there is a "default" property, which is used by async routes, then pick that
				$$invalidate(0, component = loaded && loaded.default || loaded);

				componentObj = obj;
			}

			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
			if (match && typeof match == "object" && Object.keys(match).length) {
				$$invalidate(1, componentParams = match);
			} else {
				$$invalidate(1, componentParams = null);
			}

			// Set static props, if any
			$$invalidate(2, props = routesList[i].props);

			// Dispatch the routeLoaded event then exit
			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
			dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));

			return;
		}

		// If we're still here, there was no match, so show the empty component
		$$invalidate(0, component = null);

		componentObj = null;
	});

	const writable_props = ["routes", "prefix", "restoreScrollState"];

	Object_1.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
	});

	function routeEvent_handler(event) {
		bubble($$self, event);
	}

	function routeEvent_handler_1(event) {
		bubble($$self, event);
	}

	$$self.$$set = $$props => {
		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
	};

	$$self.$capture_state = () => ({
		readable,
		derived,
		tick,
		_wrap: wrap,
		wrap: wrap$1,
		getLocation,
		loc,
		location,
		querystring,
		push,
		pop,
		replace,
		link,
		updateLink,
		scrollstateHistoryHandler,
		createEventDispatcher,
		afterUpdate,
		regexparam,
		routes,
		prefix,
		restoreScrollState,
		RouteItem,
		routesList,
		component,
		componentParams,
		props,
		dispatch,
		dispatchNextTick,
		previousScrollState,
		lastLoc,
		componentObj
	});

	$$self.$inject_state = $$props => {
		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
		if ("component" in $$props) $$invalidate(0, component = $$props.component);
		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
		if ("props" in $$props) $$invalidate(2, props = $$props.props);
		if ("previousScrollState" in $$props) previousScrollState = $$props.previousScrollState;
		if ("lastLoc" in $$props) lastLoc = $$props.lastLoc;
		if ("componentObj" in $$props) componentObj = $$props.componentObj;
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
			// Update history.scrollRestoration depending on restoreScrollState
			 history.scrollRestoration = restoreScrollState ? "manual" : "auto";
		}
	};

	return [
		component,
		componentParams,
		props,
		routes,
		prefix,
		restoreScrollState,
		routeEvent_handler,
		routeEvent_handler_1
	];
}

class Router extends SvelteComponentDev {
	constructor(options) {
		super(options);

		init(this, options, instance, create_fragment, safe_not_equal, {
			routes: 3,
			prefix: 4,
			restoreScrollState: 5
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Router",
			options,
			id: create_fragment.name
		});
	}

	get routes() {
		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set routes(value) {
		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get prefix() {
		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set prefix(value) {
		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get restoreScrollState() {
		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set restoreScrollState(value) {
		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/routes/Home.svelte generated by Svelte v3.26.0 */

const file = "src/routes/Home.svelte";

function create_fragment$1(ctx) {
	let h2;
	let t1;
	let p0;
	let t2;
	let br0;
	let t3;
	let br1;
	let t4;
	let t5;
	let p1;
	let t7;
	let p2;
	let em;
	let t9;

	const block = {
		c: function create() {
			h2 = element("h2");
			h2.textContent = "Home component";
			t1 = text("\ntesting\n");
			p0 = element("p");
			t2 = text("This sample shows how to set up the router with minimum functionality. ");
			br0 = element("br");
			t3 = text("\n    The route definition object contains a number of routes (including some with parameters and a catch-all at the end).");
			br1 = element("br");
			t4 = text("\n    The links below allow navigating between pages.");
			t5 = space();
			p1 = element("p");
			p1.textContent = "This is the Home component, which contains markup only.";
			t7 = space();
			p2 = element("p");
			em = element("em");
			em.textContent = "Hint:";
			t9 = text(" Try navigating with the links below, then use your browser's back and forward buttons.");
			add_location(h2, file, 0, 0, 0);
			add_location(br0, file, 3, 75, 111);
			add_location(br1, file, 4, 120, 237);
			add_location(p0, file, 2, 0, 32);
			add_location(p1, file, 8, 0, 301);
			add_location(em, file, 10, 3, 368);
			add_location(p2, file, 10, 0, 365);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, h2, anchor);
			insert_dev(target, t1, anchor);
			insert_dev(target, p0, anchor);
			append_dev(p0, t2);
			append_dev(p0, br0);
			append_dev(p0, t3);
			append_dev(p0, br1);
			append_dev(p0, t4);
			insert_dev(target, t5, anchor);
			insert_dev(target, p1, anchor);
			insert_dev(target, t7, anchor);
			insert_dev(target, p2, anchor);
			append_dev(p2, em);
			append_dev(p2, t9);
		},
		p: noop,
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(h2);
			if (detaching) detach_dev(t1);
			if (detaching) detach_dev(p0);
			if (detaching) detach_dev(t5);
			if (detaching) detach_dev(p1);
			if (detaching) detach_dev(t7);
			if (detaching) detach_dev(p2);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$1.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$1($$self, $$props) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Home", slots, []);
	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
	});

	return [];
}

class Home extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Home",
			options,
			id: create_fragment$1.name
		});
	}
}

/* src/routes/Name.svelte generated by Svelte v3.26.0 */

const file$1 = "src/routes/Name.svelte";

// (6:7) {#if params.last}
function create_if_block$1(ctx) {
	let t_value = /*params*/ ctx[0].last + "";
	let t;

	const block = {
		c: function create() {
			t = text(t_value);
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*params*/ 1 && t_value !== (t_value = /*params*/ ctx[0].last + "")) set_data_dev(t, t_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$1.name,
		type: "if",
		source: "(6:7) {#if params.last}",
		ctx
	});

	return block;
}

function create_fragment$2(ctx) {
	let h2;
	let t1;
	let p0;
	let t2;
	let b0;
	let t3_value = /*params*/ ctx[0].first + "";
	let t3;
	let t4;
	let b1;
	let t5;
	let p1;
	let t6;
	let code0;
	let t8;
	let t9;
	let p2;
	let em;
	let t11;
	let code1;
	let t13;
	let code2;
	let if_block = /*params*/ ctx[0].last && create_if_block$1(ctx);

	const block = {
		c: function create() {
			h2 = element("h2");
			h2.textContent = "Hi there!";
			t1 = space();
			p0 = element("p");
			t2 = text("Your name is:\n    ");
			b0 = element("b");
			t3 = text(t3_value);
			t4 = space();
			b1 = element("b");
			if (if_block) if_block.c();
			t5 = space();
			p1 = element("p");
			t6 = text("This comes from the URL, matching ");
			code0 = element("code");
			code0.textContent = "/hello/:first/:last?";
			t8 = text(", where the last name is optional.");
			t9 = space();
			p2 = element("p");
			em = element("em");
			em.textContent = "Hint:";
			t11 = text(" Try changing the URL and add your name, e.g. ");
			code1 = element("code");
			code1.textContent = "/hello/alex";
			t13 = text(" or ");
			code2 = element("code");
			code2.textContent = "/hello/jane/doe";
			add_location(h2, file$1, 0, 0, 0);
			add_location(b0, file$1, 4, 4, 46);
			add_location(b1, file$1, 5, 4, 72);
			add_location(p0, file$1, 2, 0, 20);
			add_location(code0, file$1, 7, 37, 157);
			add_location(p1, file$1, 7, 0, 120);
			add_location(em, file$1, 8, 3, 232);
			add_location(code1, file$1, 8, 63, 292);
			add_location(code2, file$1, 8, 91, 320);
			add_location(p2, file$1, 8, 0, 229);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, h2, anchor);
			insert_dev(target, t1, anchor);
			insert_dev(target, p0, anchor);
			append_dev(p0, t2);
			append_dev(p0, b0);
			append_dev(b0, t3);
			append_dev(p0, t4);
			append_dev(p0, b1);
			if (if_block) if_block.m(b1, null);
			insert_dev(target, t5, anchor);
			insert_dev(target, p1, anchor);
			append_dev(p1, t6);
			append_dev(p1, code0);
			append_dev(p1, t8);
			insert_dev(target, t9, anchor);
			insert_dev(target, p2, anchor);
			append_dev(p2, em);
			append_dev(p2, t11);
			append_dev(p2, code1);
			append_dev(p2, t13);
			append_dev(p2, code2);
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*params*/ 1 && t3_value !== (t3_value = /*params*/ ctx[0].first + "")) set_data_dev(t3, t3_value);

			if (/*params*/ ctx[0].last) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$1(ctx);
					if_block.c();
					if_block.m(b1, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(h2);
			if (detaching) detach_dev(t1);
			if (detaching) detach_dev(p0);
			if (if_block) if_block.d();
			if (detaching) detach_dev(t5);
			if (detaching) detach_dev(p1);
			if (detaching) detach_dev(t9);
			if (detaching) detach_dev(p2);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$2.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$2($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Name", slots, []);
	let { params = {} } = $$props;
	const writable_props = ["params"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Name> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("params" in $$props) $$invalidate(0, params = $$props.params);
	};

	$$self.$capture_state = () => ({ params });

	$$self.$inject_state = $$props => {
		if ("params" in $$props) $$invalidate(0, params = $$props.params);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [params];
}

class Name extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$2, create_fragment$2, safe_not_equal, { params: 0 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Name",
			options,
			id: create_fragment$2.name
		});
	}

	get params() {
		throw new Error("<Name>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set params(value) {
		throw new Error("<Name>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/routes/Wild.svelte generated by Svelte v3.26.0 */

const file$2 = "src/routes/Wild.svelte";

function create_fragment$3(ctx) {
	let h2;
	let t1;
	let p0;
	let t2;
	let code0;
	let t4;
	let code1;
	let t6;
	let t7;
	let p1;
	let t8;
	let t9_value = /*params*/ ctx[0].wild + "";
	let t9;

	const block = {
		c: function create() {
			h2 = element("h2");
			h2.textContent = "Wildcard";
			t1 = space();
			p0 = element("p");
			t2 = text("Anything in the URL after ");
			code0 = element("code");
			code0.textContent = "/wild/";
			t4 = text(" is shown below as message. That's found in the ");
			code1 = element("code");
			code1.textContent = "params.wild";
			t6 = text(" prop.");
			t7 = space();
			p1 = element("p");
			t8 = text("Your message is: ");
			t9 = text(t9_value);
			add_location(h2, file$2, 0, 0, 0);
			add_location(code0, file$2, 2, 29, 48);
			add_location(code1, file$2, 2, 96, 115);
			add_location(p0, file$2, 2, 0, 19);
			add_location(p1, file$2, 4, 0, 151);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, h2, anchor);
			insert_dev(target, t1, anchor);
			insert_dev(target, p0, anchor);
			append_dev(p0, t2);
			append_dev(p0, code0);
			append_dev(p0, t4);
			append_dev(p0, code1);
			append_dev(p0, t6);
			insert_dev(target, t7, anchor);
			insert_dev(target, p1, anchor);
			append_dev(p1, t8);
			append_dev(p1, t9);
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*params*/ 1 && t9_value !== (t9_value = /*params*/ ctx[0].wild + "")) set_data_dev(t9, t9_value);
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(h2);
			if (detaching) detach_dev(t1);
			if (detaching) detach_dev(p0);
			if (detaching) detach_dev(t7);
			if (detaching) detach_dev(p1);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$3.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$3($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Wild", slots, []);
	let { params = {} } = $$props;
	const writable_props = ["params"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Wild> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("params" in $$props) $$invalidate(0, params = $$props.params);
	};

	$$self.$capture_state = () => ({ params });

	$$self.$inject_state = $$props => {
		if ("params" in $$props) $$invalidate(0, params = $$props.params);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [params];
}

class Wild extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$3, create_fragment$3, safe_not_equal, { params: 0 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Wild",
			options,
			id: create_fragment$3.name
		});
	}

	get params() {
		throw new Error("<Wild>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set params(value) {
		throw new Error("<Wild>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/routes/List.svelte generated by Svelte v3.26.0 */
const file$3 = "src/routes/List.svelte";

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[6] = list[i];
	return child_ctx;
}

// (27:12) {:else}
function create_else_block_1(ctx) {
	let img;
	let img_src_value;

	const block = {
		c: function create() {
			img = element("img");
			attr_dev(img, "class", "uk-preserve-width");
			if (img.src !== (img_src_value = "https://img.icons8.com/fluent/344/folder-invoices.png")) attr_dev(img, "src", img_src_value);
			attr_dev(img, "width", "40");
			attr_dev(img, "alt", "");
			add_location(img, file$3, 27, 12, 940);
		},
		m: function mount(target, anchor) {
			insert_dev(target, img, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(img);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block_1.name,
		type: "else",
		source: "(27:12) {:else}",
		ctx
	});

	return block;
}

// (20:12) {#if file.data.type=="file"}
function create_if_block_2(ctx) {
	let img;
	let img_src_value;

	const block = {
		c: function create() {
			img = element("img");
			attr_dev(img, "class", "uk-preserve-width");
			if (img.src !== (img_src_value = "https://img.icons8.com/color/344/file.png https://img.icons8.com/fluent/344/folder-invoices.png")) attr_dev(img, "src", img_src_value);
			attr_dev(img, "width", "40");
			attr_dev(img, "alt", "");
			add_location(img, file$3, 20, 15, 664);
		},
		m: function mount(target, anchor) {
			insert_dev(target, img, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(img);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_2.name,
		type: "if",
		source: "(20:12) {#if file.data.type==\\\"file\\\"}",
		ctx
	});

	return block;
}

// (44:12) {:else}
function create_else_block$1(ctx) {
	let a;
	let t_value = /*file*/ ctx[6].data.name + "";
	let t;
	let a_href_value;

	const block = {
		c: function create() {
			a = element("a");
			t = text(t_value);
			attr_dev(a, "class", "uk-link-reset");
			attr_dev(a, "href", a_href_value = "https://gateway.ipfs.io/ipfs/" + /*file*/ ctx[6].data.ipfsHash);
			add_location(a, file$3, 44, 12, 1481);
		},
		m: function mount(target, anchor) {
			insert_dev(target, a, anchor);
			append_dev(a, t);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*data*/ 1 && t_value !== (t_value = /*file*/ ctx[6].data.name + "")) set_data_dev(t, t_value);

			if (dirty & /*data*/ 1 && a_href_value !== (a_href_value = "https://gateway.ipfs.io/ipfs/" + /*file*/ ctx[6].data.ipfsHash)) {
				attr_dev(a, "href", a_href_value);
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(a);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block$1.name,
		type: "else",
		source: "(44:12) {:else}",
		ctx
	});

	return block;
}

// (37:12) {#if file.data.type=='folder'}
function create_if_block_1(ctx) {
	let a;
	let t_value = /*file*/ ctx[6].data.name + "";
	let t;
	let a_href_value;

	const block = {
		c: function create() {
			a = element("a");
			t = text(t_value);
			attr_dev(a, "class", "uk-link-reset");
			attr_dev(a, "href", a_href_value = "#" + (/*$location*/ ctx[1] + "/" + /*file*/ ctx[6].data.name));
			add_location(a, file$3, 37, 15, 1272);
		},
		m: function mount(target, anchor) {
			insert_dev(target, a, anchor);
			append_dev(a, t);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*data*/ 1 && t_value !== (t_value = /*file*/ ctx[6].data.name + "")) set_data_dev(t, t_value);

			if (dirty & /*$location, data*/ 3 && a_href_value !== (a_href_value = "#" + (/*$location*/ ctx[1] + "/" + /*file*/ ctx[6].data.name))) {
				attr_dev(a, "href", a_href_value);
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(a);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1.name,
		type: "if",
		source: "(37:12) {#if file.data.type=='folder'}",
		ctx
	});

	return block;
}

// (53:39) {#if file.data.type == "file"}
function create_if_block$2(ctx) {
	let t_value = /*fileSizeToShortString*/ ctx[2](/*file*/ ctx[6].data.size) + "";
	let t;

	const block = {
		c: function create() {
			t = text(t_value);
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*data*/ 1 && t_value !== (t_value = /*fileSizeToShortString*/ ctx[2](/*file*/ ctx[6].data.size) + "")) set_data_dev(t, t_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$2.name,
		type: "if",
		source: "(53:39) {#if file.data.type == \\\"file\\\"}",
		ctx
	});

	return block;
}

// (14:9) {#each data as file}
function create_each_block(ctx) {
	let tr;
	let td0;
	let input;
	let t0;
	let td1;
	let t1;
	let td2;
	let t2;
	let td3;
	let t3;

	function select_block_type(ctx, dirty) {
		if (/*file*/ ctx[6].data.type == "file") return create_if_block_2;
		return create_else_block_1;
	}

	let current_block_type = select_block_type(ctx);
	let if_block0 = current_block_type(ctx);

	function select_block_type_1(ctx, dirty) {
		if (/*file*/ ctx[6].data.type == "folder") return create_if_block_1;
		return create_else_block$1;
	}

	let current_block_type_1 = select_block_type_1(ctx);
	let if_block1 = current_block_type_1(ctx);
	let if_block2 = /*file*/ ctx[6].data.type == "file" && create_if_block$2(ctx);

	const block = {
		c: function create() {
			tr = element("tr");
			td0 = element("td");
			input = element("input");
			t0 = space();
			td1 = element("td");
			if_block0.c();
			t1 = space();
			td2 = element("td");
			if_block1.c();
			t2 = space();
			td3 = element("td");
			if (if_block2) if_block2.c();
			t3 = space();
			attr_dev(input, "class", "uk-checkbox");
			attr_dev(input, "type", "checkbox");
			add_location(input, file$3, 16, 15, 527);
			add_location(td0, file$3, 15, 12, 507);
			add_location(td1, file$3, 18, 12, 603);
			attr_dev(td2, "class", "uk-table-link");
			add_location(td2, file$3, 35, 12, 1187);
			attr_dev(td3, "class", "uk-text-nowrap");
			add_location(td3, file$3, 52, 12, 1724);
			add_location(tr, file$3, 14, 9, 490);
		},
		m: function mount(target, anchor) {
			insert_dev(target, tr, anchor);
			append_dev(tr, td0);
			append_dev(td0, input);
			append_dev(tr, t0);
			append_dev(tr, td1);
			if_block0.m(td1, null);
			append_dev(tr, t1);
			append_dev(tr, td2);
			if_block1.m(td2, null);
			append_dev(tr, t2);
			append_dev(tr, td3);
			if (if_block2) if_block2.m(td3, null);
			append_dev(tr, t3);
		},
		p: function update(ctx, dirty) {
			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
				if_block0.d(1);
				if_block0 = current_block_type(ctx);

				if (if_block0) {
					if_block0.c();
					if_block0.m(td1, null);
				}
			}

			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
				if_block1.p(ctx, dirty);
			} else {
				if_block1.d(1);
				if_block1 = current_block_type_1(ctx);

				if (if_block1) {
					if_block1.c();
					if_block1.m(td2, null);
				}
			}

			if (/*file*/ ctx[6].data.type == "file") {
				if (if_block2) {
					if_block2.p(ctx, dirty);
				} else {
					if_block2 = create_if_block$2(ctx);
					if_block2.c();
					if_block2.m(td3, null);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(tr);
			if_block0.d();
			if_block1.d();
			if (if_block2) if_block2.d();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block.name,
		type: "each",
		source: "(14:9) {#each data as file}",
		ctx
	});

	return block;
}

function create_fragment$4(ctx) {
	let div;
	let table;
	let thead;
	let tr;
	let th0;
	let input;
	let t0;
	let th1;
	let t2;
	let th2;
	let t4;
	let th3;
	let t6;
	let tbody;
	let each_value = /*data*/ ctx[0];
	validate_each_argument(each_value);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	const block = {
		c: function create() {
			div = element("div");
			table = element("table");
			thead = element("thead");
			tr = element("tr");
			th0 = element("th");
			input = element("input");
			t0 = space();
			th1 = element("th");
			th1.textContent = "Images";
			t2 = space();
			th2 = element("th");
			th2.textContent = "Name";
			t4 = space();
			th3 = element("th");
			th3.textContent = "Size";
			t6 = space();
			tbody = element("tbody");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr_dev(input, "class", "uk-checkbox");
			attr_dev(input, "type", "checkbox");
			add_location(input, file$3, 5, 15, 191);
			attr_dev(th0, "class", "uk-table-shrink");
			add_location(th0, file$3, 4, 12, 147);
			attr_dev(th1, "class", "uk-table-shrink");
			add_location(th1, file$3, 7, 12, 267);
			attr_dev(th2, "class", "uk-table-expand");
			add_location(th2, file$3, 8, 12, 319);
			attr_dev(th3, "class", "uk-table-shrink");
			add_location(th3, file$3, 9, 12, 369);
			add_location(tr, file$3, 3, 9, 130);
			add_location(thead, file$3, 2, 6, 113);
			add_location(tbody, file$3, 12, 6, 443);
			attr_dev(table, "class", "uk-table uk-table-hover uk-table-middle uk-table-divider");
			add_location(table, file$3, 1, 3, 34);
			attr_dev(div, "class", "uk-overflow-auto");
			add_location(div, file$3, 0, 0, 0);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, table);
			append_dev(table, thead);
			append_dev(thead, tr);
			append_dev(tr, th0);
			append_dev(th0, input);
			append_dev(tr, t0);
			append_dev(tr, th1);
			append_dev(tr, t2);
			append_dev(tr, th2);
			append_dev(tr, t4);
			append_dev(tr, th3);
			append_dev(table, t6);
			append_dev(table, tbody);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(tbody, null);
			}
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*fileSizeToShortString, data, $location*/ 7) {
				each_value = /*data*/ ctx[0];
				validate_each_argument(each_value);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(tbody, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			destroy_each(each_blocks, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$4.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$4($$self, $$props, $$invalidate) {
	let $location;
	validate_store(location, "location");
	component_subscribe($$self, location, $$value => $$invalidate(1, $location = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("List", slots, []);
	let { params = {} } = $$props;

	const fetchData = async parent => {
		let res = await fetch(`${api_url}/database?func=getFilesInParent&arg=/${parent}`).catch(e => {
			alert("error");
		});

		res = await res.json();
		$$invalidate(0, data = res.data);
	};

	let data = [];
	let api_url = "https://cloud-drive.vercel.app/api";

	const fileSizeToShortString = fileSize => {
		if (fileSize < 2 ** 10) {
			return `${fileSize} B`;
		}

		if (fileSize < 2 ** 20) {
			return `${Math.floor(fileSize / 2 ** 10)} KB`;
		}

		if (fileSize < 2 ** 30) {
			return `${Math.floor(fileSize / 2 ** 20)} MB`;
		}

		return `${Math.floor(fileSize / 2 ** 30)} GB`;
	};

	const writable_props = ["params"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<List> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("params" in $$props) $$invalidate(3, params = $$props.params);
	};

	$$self.$capture_state = () => ({
		onMount,
		location,
		params,
		fetchData,
		data,
		api_url,
		fileSizeToShortString,
		$location
	});

	$$self.$inject_state = $$props => {
		if ("params" in $$props) $$invalidate(3, params = $$props.params);
		if ("data" in $$props) $$invalidate(0, data = $$props.data);
		if ("api_url" in $$props) api_url = $$props.api_url;
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*params*/ 8) {
			 fetchData(params.wild);
		}
	};

	return [data, $location, fileSizeToShortString, params];
}

class List extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$4, create_fragment$4, safe_not_equal, { params: 3 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "List",
			options,
			id: create_fragment$4.name
		});
	}

	get params() {
		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set params(value) {
		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/routes/NotFound.svelte generated by Svelte v3.26.0 */

const file$4 = "src/routes/NotFound.svelte";

function create_fragment$5(ctx) {
	let h2;
	let t1;
	let p;

	const block = {
		c: function create() {
			h2 = element("h2");
			h2.textContent = "NotFound";
			t1 = space();
			p = element("p");
			p.textContent = "Oops, this route doesn't exist!";
			add_location(h2, file$4, 0, 0, 0);
			add_location(p, file$4, 2, 0, 19);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, h2, anchor);
			insert_dev(target, t1, anchor);
			insert_dev(target, p, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(h2);
			if (detaching) detach_dev(t1);
			if (detaching) detach_dev(p);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$5.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$5($$self, $$props) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("NotFound", slots, []);
	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NotFound> was created with unknown prop '${key}'`);
	});

	return [];
}

class NotFound extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "NotFound",
			options,
			id: create_fragment$5.name
		});
	}
}

// Components

// Export the route definition object
var routes = {
    // Exact path
    '/': Home,

    // Using named parameters, with last being optional
    '/hello/:first/:last?': Name,

    // Wildcard parameter
    // Included twice to match both `/wild` (and nothing after) and `/wild/*` (with anything after)
    '/wild': Wild,
    '/wild/*': Wild,
    '/list/*': List,
    // Catch-all, must be last
    '*': NotFound,
};

/* src/App.svelte generated by Svelte v3.26.0 */

const file$5 = "src/App.svelte";

function create_fragment$6(ctx) {
	let meta0;
	let link0;
	let meta1;
	let link1;
	let script0;
	let script0_src_value;
	let script1;
	let script1_src_value;
	let link2;
	let link3;
	let t;
	let router;
	let current;
	router = new Router({ props: { routes }, $$inline: true });

	const block = {
		c: function create() {
			meta0 = element("meta");
			link0 = element("link");
			meta1 = element("meta");
			link1 = element("link");
			script0 = element("script");
			script1 = element("script");
			link2 = element("link");
			link3 = element("link");
			t = space();
			create_component(router.$$.fragment);
			document.title = "Cloud Drive";
			attr_dev(meta0, "charset", "utf-8");
			add_location(meta0, file$5, 2, 4, 51);
			attr_dev(link0, "rel", "shortcut icon");
			attr_dev(link0, "href", "%PUBLIC_URL%/favicon.ico");
			add_location(link0, file$5, 3, 4, 78);
			attr_dev(meta1, "name", "viewport");
			attr_dev(meta1, "content", "width=device-width, initial-scale=1, shrink-to-fit=no");
			add_location(meta1, file$5, 4, 4, 141);
			attr_dev(link1, "rel", "prefetch");
			attr_dev(link1, "onload", "this.rel='stylesheet'");
			attr_dev(link1, "href", "https://cdn.jsdelivr.net/npm/uikit@3.5.7/dist/css/uikit.min.css");
			add_location(link1, file$5, 5, 2, 230);
			script0.async = true;
			if (script0.src !== (script0_src_value = "https://cdn.jsdelivr.net/npm/uikit@3.5.7/dist/js/uikit.min.js")) attr_dev(script0, "src", script0_src_value);
			add_location(script0, file$5, 7, 0, 374);
			script1.async = true;
			if (script1.src !== (script1_src_value = "https://cdn.jsdelivr.net/npm/uikit@3.5.7/dist/js/uikit-icons.min.js")) attr_dev(script1, "src", script1_src_value);
			add_location(script1, file$5, 8, 0, 466);
			attr_dev(link2, "rel", "preconnect");
			attr_dev(link2, "href", "https://cloudflare-ipfs.com");
			add_location(link2, file$5, 9, 0, 565);
			attr_dev(link3, "rel", "preconnect");
			attr_dev(link3, "href", "https://gateway.ipfs.io");
			add_location(link3, file$5, 10, 0, 624);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			append_dev(document.head, meta0);
			append_dev(document.head, link0);
			append_dev(document.head, meta1);
			append_dev(document.head, link1);
			append_dev(document.head, script0);
			append_dev(document.head, script1);
			append_dev(document.head, link2);
			append_dev(document.head, link3);
			insert_dev(target, t, anchor);
			mount_component(router, target, anchor);
			current = true;
		},
		p: noop,
		i: function intro(local) {
			if (current) return;
			transition_in(router.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(router.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			detach_dev(meta0);
			detach_dev(link0);
			detach_dev(meta1);
			detach_dev(link1);
			detach_dev(script0);
			detach_dev(script1);
			detach_dev(link2);
			detach_dev(link3);
			if (detaching) detach_dev(t);
			destroy_component(router, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$6.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$6($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("App", slots, []);
	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
	});

	$$self.$capture_state = () => ({ Router, routes });
	return [];
}

class App extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "App",
			options,
			id: create_fragment$6.name
		});
	}
}

// Initialize the Svelte app and inject it in the DOM
const app = new App({
    target: document.body
});

export default app;
//# sourceMappingURL=main.js.map
