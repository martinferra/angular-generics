import { Expose } from "class-transformer/decorators";

export function WithDiscriminator(discriminatorKey: string = '__t') {
    return function(parentClass: Function) {

        Object.defineProperty(parentClass.prototype, discriminatorKey, {
            enumerable: true,
            get() { return this.constructor.classId },
            set(discriminatorValue) {}
        });

        /* Hay que conseguir que la property esté expuesta al 
        transformar la instancia de la clase a un objeto plano */
        const exposeFn = Expose()
        exposeFn(parentClass, discriminatorKey)
    }
}