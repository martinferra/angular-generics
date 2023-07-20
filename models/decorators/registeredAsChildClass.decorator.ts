export function RegisteredAsChildClass(classId: string, description: string) {
    return function(childClass: any) {
        childClass['typeDesc'] = description
        if(!('classId' in childClass)) {
            Object.defineProperty(childClass, 'classId', {
                enumerable: false,
                get() { return classId },
                set() {}
            });
        }
        let parentClass = Object.getPrototypeOf(childClass)
        if(!parentClass.childClasses) parentClass.childClasses = []
        parentClass.childClasses.push(childClass)
    }
}