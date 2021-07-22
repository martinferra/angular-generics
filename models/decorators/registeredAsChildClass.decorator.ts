export function RegisteredAsChildClass(classId: string, description: string) {
    return function(childClass: Function) {
        childClass['typeDesc'] = description
        Object.defineProperty(childClass, 'classId', {
            enumerable: false,
            get() { return classId },
            set() {}
        });
        let parentClass = Object.getPrototypeOf(childClass)
        if(!parentClass.childClasses) parentClass.childClasses = []
        parentClass.childClasses.push(childClass)
    }
}