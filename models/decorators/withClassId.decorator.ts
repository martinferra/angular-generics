export function WithClassId(classId: string) {
    return function(compClass: Function) {
        if(!('classId' in compClass)) {
            Object.defineProperty(compClass, 'classId', {
                enumerable: false,
                get() { return classId },
                set() {}
            });
        }
    }
}