'use strict';

const matchObject = (object, o) => {
    for (const [key, callback] of o) {
        if (key in object) callback(object[key]);
    }
};

const createElement = (tagName, options) => {
    const element = document.createElement(tagName);
    matchObject(options, [
        ['parentElement', parentElement => parentElement.appendChild(element)],
        ['attributes', attributes => {
            for (const name in attributes) element.setAttribute(name, attributes[name]);
        }],
        ['properties', properties => {
            for (const key in properties) element[key] = properties[key];
        }],
        ['listeners', listeners => {
            for (const [type, callback] of listeners) element.addEventListener(type, callback);
        }]
    ]);
    return element;
};

const assertError = (condition, constructor, message) => {
    if (!condition) throw new constructor(message);
}

const assertType = (value, type, name) => assertError(
    typeof value === type,
    TypeError,
    `${name} must be a ${type}`
);

const assertInstance = (value, constructor, name) => assertError(
    value instanceof constructor,
    TypeError,
    `${name} must be an instance of ${constructor.name}`
);

class Task {
    static createHTML(task) {
        const element = createElement('div', {
            attributes: {class: 'task'}
        });
        const menu = createElement('div', {
            parentElement: element,
            attributes: {class: 'menu'},
            listeners: [
                ['click', event => {
                    if (event.target.tagName === 'BUTTON') return;
                    task.show = !task.show;
                }],
                ['contextmenu', event => {
                    event.preventDefault();
                    task.done = !task.done;
                }]
            ]
        });
        const remove = createElement('button', {
            parentElement: menu,
            attributes: {class: 'action'},
            properties: {innerText: 'X'},
            listeners: [
                ['click', event => {
                    if (!confirm(`remove "${task.name}"?`)) return;
                    if (task.parent !== null) return task.parent.removeChild(task);
                    const children = task.children;
                    for (const child of children) {
                        child.parent = null;
                    }
                }]
            ]
        });
        const edit = createElement('button', {
            parentElement: menu,
            attributes: {class: 'action'},
            properties: {innerText: '#'},
            listeners: [
                ['click', event => task.name = prompt('task name:', task.name) || task.name]
            ]
        });
        const add = createElement('button', {
            parentElement: menu,
            attributes: {class: 'action'},
            properties: {innerText: '+'},
            listeners: [
                ['click', event => {
                    const name = prompt('new task name:');
                    if (name === null) return;
                    task.add(name || undefined);
                }]
            ]
        });
        const name = createElement('a', {
            parentElement: menu,
            attributes: {class: 'name'}
        });
        const progress = createElement('span', {
            parentElement: menu,
            attributes: {class: 'progress'}
        });
        const container = createElement('div', {
            parentElement: element,
            attributes: {class: 'container'}
        });
        return {element, menu, remove, edit, add, name, progress, container};
    }
    static import() {
        //create task from json
    }
    #name;
    #parent = null;
    #children = [];
    #done;
    #show;
    constructor(name = 'task', parent = null) {
        this.html = Task.createHTML(this);
        this.name = name;
        this.parent = parent;
        this.done = false;
        this.show = true;
    }
    get name() {
        return this.#name;
    }
    set name(value) {
        const string = String(value);
        this.#name = string;
        this.html.name.innerText = string;
    }
    get parent() {
        return this.#parent;
    }
    set parent(task) {
        if (task !== null) assertInstance(task, Task, 'parent');
        if (this.contains(task)) throw new Error('child cannot contain parent');
        if (this.#parent !== null) this.#parent.removeChild(this);
        if (task !== null) task.appendChild(this);
        this.#parent = task;
    }
    get children() {
        return this.#children.slice();
    }
    get done() {
        return this.#done;
    }
    set done(value) {
        assertType(value, 'boolean', 'done');
        this.#done = value;
        if (this.#parent !== null) this.#parent.done = this.#parent.progress === 1;
        if (value) this.html.menu.classList.add('complete');
        else this.html.menu.classList.remove('complete');
    }
    get show() {
        return this.#show;
    }
    set show(value) {
        assertType(value, 'boolean', 'done');
        if (this.#children.length === 0) value = true;
        this.#show = value;
        this.html.container.style.display = value ? 'inherit' : 'none';
        if (value) this.html.menu.classList.remove('dark');
        else this.html.menu.classList.add('dark');
    }
    get progress() {
        const total = this.#children.length;
        if (total === 0) return 0;
        let done = 0;
        for (const child of this.#children) {
            if (child.progress === 1 || child.done) done++;
        }
        const progress = done / total;
        this.html.progress.innerText = `${Math.round(progress * 100)}%`;
        return progress;
    }
    removeChild(child) {
        const index = this.#children.indexOf(child);
        if (index === -1) return;
        this.#children.splice(index, 1);
        this.html.container.removeChild(child.html.element);
    }
    appendChild(child) {
        this.#children.push(child);
        this.html.container.appendChild(child.html.element);
    }
    add(name) {
        return new Task(name, this);
    }
    contains(task) {
        for (const child of this.#children) {
            if (child === task || child.contains(task)) return true;
        }
    }
    export() {
        //export to json
    }
}

const root = new Task('root');
const a = root.add('a');
const b = root.add('b');
const b1 = b.add('b1');
const b2 = b.add('b2');
const c = root.add('c');
const c1 = c.add('c1');
const c2 = c.add('c2');
const c3 = c.add('c3');
const d = root.add('d');
const d1 = d.add('d1');
const d1a = d1.add('d1a');

document.body.appendChild(root.html.element);