import { ValidatorFn, AbstractControl, UntypedFormGroup, AsyncValidatorFn, UntypedFormControl, UntypedFormArray } from "@angular/forms";

export function createValidator(name: string, control: AbstractControl): ControlValidator {
    if(control instanceof UntypedFormGroup) {
        return new FormValidator(control as UntypedFormGroup, name);
    } else if(control instanceof UntypedFormArray) {
        return new ArrayValidator(control as UntypedFormArray, name);
    } else {
        return new ControlValidator(name, control as UntypedFormControl);
    }
}

export const AppRegExp = {
    onlyNumbers: /^\d*$/,
    decimalNumbers: /^([0-9]+\.?[0-9]*|\.[0-9]+)$/,
    onlyLetters: /^([A-Za-z\u00C0-\u00D6\u00D8-\u00f6\u00f8-\u00ff\s]*)$/,
    onlyAlphaNumerics: /^([A-Za-z\u00C0-\u00D6\u00D8-\u00f6\u00f8-\u00ff\s\d]*)$/,
    onlyAlphaNumericsOrPunctuation: /^([A-Za-z\u00C0-\u00D6\u00D8-\u00f6\u00f8-\u00ff\s\d\.]*)$/,
    noZeroAtStart: /^[^0]/,
    email: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/
}

export class CustomValidators {

    public static regexValidator(errorKey: string, regex: RegExp): ValidatorFn {

        return (control: AbstractControl): {[key: string]: any} | null => {
            if (!control.value) {
                return null;
            }

            let _regex = regex instanceof Function? regex() : regex;

            const valid = _regex.test(control.value.toString());
            return valid ? null : { [errorKey]: true };
        };
    }

    public static lengthValidator(errorKey: string, minLength: any, maxLength: any): ValidatorFn {

        return (control: AbstractControl): {[key: string]: any} | null => {
          if (!control.value) {
            return null;
          }

          let _minLength = minLength instanceof Function? minLength(): minLength
          let _maxLength = minLength instanceof Function? maxLength(): maxLength

          const valid = control.value.toString().trim().length >= _minLength && control.value.toString().trim().length <= _maxLength;
          return valid ? null : { [errorKey]: true };
        };
    }

    public static exactLengthValidator(errorKey: string, length: any): ValidatorFn {

        return (control: AbstractControl): {[key: string]: any} | null => {

          let _length = length instanceof Function? length() : length

          if (!control.value || !_length) {
            return null;
          }

          const valid = control.value.toString().trim().length === _length
          return valid ? null : { [errorKey]: true }
        };
    }

    public static conditionalValidator(predicate: any, validator: ValidatorFn): ValidatorFn {
        return (formControl: AbstractControl) => {
            if (predicate()) {
               return validator(formControl); 
            }
            return null;
        }
    }
}

export class ControlValidatorEntry {

    errorKey: string
    validatorFn: any
    _errorMessage: string | Function
    args: any[]

    constructor(errorKey: string, errorMessage: any, validatorFnFactory: Function, ...args: any[]) { 

        let validatorFn = validatorFnFactory(errorKey, ...args)

        this.errorKey = errorKey
        this.validatorFn = validatorFn
        this._errorMessage = errorMessage
        this.args = args
    }

    get errorMessage() {
        let args = this.args.map( arg => arg instanceof Function? arg() : arg )
        return (this._errorMessage instanceof Function)? this._errorMessage(...args) : this._errorMessage
    }
}

export class ControlValidator {

    public formControlName: string|undefined
    public control: AbstractControl
    protected syncEntries: Array<ControlValidatorEntry> = []
    protected asyncEntries: Array<ControlValidatorEntry> = []

    constructor(formControlName: string|undefined, control: AbstractControl) {
        this.formControlName = formControlName
        this.control = control
    }

    public addSyncEntry(
        errorKey: string, 
        errorMessage: string | Function, 
        validatorFnFactory: Function, 
        ...args: any[]): ControlValidator {

        this.syncEntries.push(new ControlValidatorEntry(errorKey, errorMessage, validatorFnFactory, ...args))
        return this
    }

    public addAsyncEntry(
        errorKey: string, 
        errorMessage: string | Function, 
        validatorFnFactory: Function, 
        ...args: any[]): ControlValidator {

        this.asyncEntries.push(new ControlValidatorEntry(errorKey, errorMessage, validatorFnFactory, ...args))
        return this
    }

    public get syncValidatorsArray(): Array<ValidatorFn> {
        return this.syncEntries.map( (entry: ControlValidatorEntry) => entry.validatorFn )
    }

    public get asyncValidatorsArray(): Array<AsyncValidatorFn> {
        return this.asyncEntries.map( (entry: ControlValidatorEntry) => entry.validatorFn )
    }

    public hasErrors(): boolean {
        return this.control.errors? !!(this.control.errors.required || this.control.touched || this.control.dirty) : false
    }

    public get errorMessage(): string | null {
        if(!this.control.errors) return ''

        let errorMessage = ''
        let idx = 0
        while(!errorMessage && idx<this.syncEntries.length) {
            if(this.control.errors[this.syncEntries[idx].errorKey]) 
                errorMessage = this.syncEntries[idx].errorMessage
            idx++
        }
        idx = 0
        while(!errorMessage && idx<this.asyncEntries.length) {
            if(this.control.errors[this.asyncEntries[idx].errorKey]) 
                errorMessage = this.asyncEntries[idx].errorMessage
            idx++
        }
        return errorMessage
    }

    public setValidatorEntries(
        syncEntries: Array<ControlValidatorEntry>, 
        asyncEntries: Array<ControlValidatorEntry>=[]) {

        this.syncEntries = syncEntries
        this.asyncEntries = asyncEntries
        this.control.setValidators(this.syncValidatorsArray)
        this.control.setAsyncValidators(this.asyncValidatorsArray)
    }
}

export class FormValidator extends ControlValidator {

    controlValidators: Array<ControlValidator> = []

    constructor(form: AbstractControl, formControlName?: string) {

        super(formControlName, form);

        Object.keys((this.control as UntypedFormGroup).controls).forEach( key => {
            const ctrl = this.control.get(key);
            if(ctrl) {
                this.controlValidators.push(createValidator(key, ctrl))
            }
        });
    }

    public hasErrors(): boolean {
        return this.controlValidators.reduce((_hasErrors: boolean, controlValidator: ControlValidator) => { 
            return _hasErrors || controlValidator.hasErrors();
        }, false);
    }

    public get(controlKey: string): ControlValidator|undefined {
        return this.controlValidators.find( (cv: ControlValidator) => cv.formControlName === controlKey)
    }
}

export class ArrayValidator extends FormValidator {

    constructor(array: AbstractControl, formControlName?: string) {
        super(array, formControlName);
    }

    public at(index: number): ControlValidator|undefined {
        return this.controlValidators[index];
    }
}