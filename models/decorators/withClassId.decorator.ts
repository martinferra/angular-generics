export function WithClassId(classId: string) {
    return function(compClass: Function) {
        Object.defineProperty(compClass, 'classId', {
            enumerable: false,
            get() { return classId },
            set() {}
        });
    }
}