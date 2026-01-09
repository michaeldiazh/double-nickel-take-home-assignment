type DoubleLinkedNode<T> = {
    value: T;
    next: DoubleLinkedNode<T> | null;
    prev: DoubleLinkedNode<T> | null;
}

export type DoubleLinkedQueue<T> = {
    readonly head: DoubleLinkedNode<T> | null;
    readonly tail: DoubleLinkedNode<T> | null;
    readonly length: number;
    enqueue: (value: T) => void;
    dequeue: () => T | null;
    peek: () => T | null;
    isEmpty: () => boolean;
}

const createDoubleLinkedNode = <T>(value: T): DoubleLinkedNode<T> => (
    {
        value,
        next: null,
        prev: null
    }
);

export const createLinkedQueue = <T>(): DoubleLinkedQueue<T> => {
    let head: DoubleLinkedNode<T> | null = null;
    let tail: DoubleLinkedNode<T> | null = null;
    let length = 0;

    const enqueue = (value: T): void => {
        const newNode = createDoubleLinkedNode(value);
        if (!head) {
            head = newNode;
            tail = newNode;
        } else {
            tail!.next = newNode;
            newNode.prev = tail;
            tail = newNode;
        }
        length++;
    };
    const dequeue = (): T | null => {
        if (!head) return null;
        const oldHead = head;
        const dequeuedValue = oldHead.value;
        head = oldHead.next;
        oldHead.next = null;
        oldHead.prev = null;
        if (head) head.prev = null;
        else tail = null;
        length--;
        return dequeuedValue;
    };
    const peek = (): T | null => {
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
}