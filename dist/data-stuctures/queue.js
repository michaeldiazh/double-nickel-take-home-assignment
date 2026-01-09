"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLinkedQueue = void 0;
const createDoubleLinkedNode = (value) => ({
    value,
    next: null,
    prev: null
});
const createLinkedQueue = () => {
    let head = null;
    let tail = null;
    let length = 0;
    const enqueue = (value) => {
        const newNode = createDoubleLinkedNode(value);
        if (!head) {
            head = newNode;
            tail = newNode;
        }
        else {
            tail.next = newNode;
            newNode.prev = tail;
            tail = newNode;
        }
        length++;
    };
    const dequeue = () => {
        if (!head)
            return null;
        const oldHead = head;
        const dequeuedValue = oldHead.value;
        head = oldHead.next;
        oldHead.next = null;
        oldHead.prev = null;
        if (head)
            head.prev = null;
        else
            tail = null;
        length--;
        return dequeuedValue;
    };
    const peek = () => {
        return head ? head.value : null;
    };
    return {
        get head() {
            return head;
        },
        get tail() {
            return tail;
        },
        get length() {
            return length;
        },
        isEmpty: () => length === 0,
        enqueue,
        dequeue,
        peek
    };
};
exports.createLinkedQueue = createLinkedQueue;
