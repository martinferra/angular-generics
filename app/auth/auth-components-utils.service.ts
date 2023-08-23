import { Injectable } from '@angular/core';
import {
  AbstractControl,
  UntypedFormControl,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthService, UserInfo } from '@app/shared/services/auth/auth.service';
import { map, Observable, of } from 'rxjs';
import {
  AppRegExp,
  ControlValidator,
  ControlValidatorEntry,
  CustomValidators,
  FormValidator,
} from 'src/generic/app/appValidators';

@Injectable({
  providedIn: 'root',
})
export class AuthComponentsUtilsService {
  constructor(private authService: AuthService) {}

  private getPasswordsMatchValidatorFn(): any {
    return (errorKey: string) => {
      return (control: UntypedFormControl): ValidationErrors | null => {
        const password = control.root.get('password');
        return password && control.value !== password.value
          ? { [errorKey]: true }
          : null;
      };
    };
  }

  private getUserRegisteredValidatorFn(
    validIfUnregistered: boolean,
    userInfoCb?: (userInfo: UserInfo) => {}
  ): any {
    const thisService: AuthComponentsUtilsService = this;
    return (errorKey: string) => {
      return (
        control: AbstractControl
      ): Observable<ValidationErrors | null> => {
        let err: ValidationErrors = { [errorKey]: true };
        if (
          !validIfUnregistered &&
          (Boolean(Validators.required(control)) ||
            Boolean(Validators.email(control)))
        ) {
          return of(err);
        }
        return thisService.authService.checkUser(control.value).pipe(
          map((userInfo: UserInfo) => {
            userInfoCb?.(userInfo);
            if (validIfUnregistered ? !userInfo.exists : userInfo.exists) {
              return null;
            } else {
              return err;
            }
          })
        );
      };
    };
  }

  private getFullNameValidatorEntries(): [
    ControlValidatorEntry[],
    ControlValidatorEntry[]
  ] {
    return [
      [
        new ControlValidatorEntry(
          'required',
          'Ingrese su nombre completo',
          () => Validators.required
        ),
        new ControlValidatorEntry(
          'onlyLetters',
          `Solo letras y números`,
          CustomValidators.regexValidator,
          AppRegExp.onlyAlphaNumerics
        ),
      ],
      [],
    ];
  }

  private getEmailValidatorEntries(
    validIfUnregistered: boolean = true,
    userInfoCb?: (userInfo: UserInfo) => {}
  ): [ControlValidatorEntry[], ControlValidatorEntry[]] {
    return [
      [
        new ControlValidatorEntry(
          'required',
          'Ingrese un correo electrónico',
          () => Validators.required
        ),

        new ControlValidatorEntry(
          'email',
          'Formato de correo electrónico incorrecto',
          CustomValidators.regexValidator,
          AppRegExp.email
        ),
      ],
      [
        new ControlValidatorEntry(
          'userNotRegistered',
          validIfUnregistered
            ? 'El correo electrónico ya está registrado'
            : 'El correo electrónico no está registrado',
          this.getUserRegisteredValidatorFn(validIfUnregistered, userInfoCb)
        ),
      ],
    ];
  }

  public getEmailValidator(
    emailCtrl: AbstractControl,
    validIfUnregistered: boolean = true,
    userInfoCb?: (userInfo: UserInfo) => {}
  ): ControlValidator {
    const emailValidator = new ControlValidator('email', emailCtrl);
    emailValidator.setValidatorEntries(
      ...this.getEmailValidatorEntries(validIfUnregistered, userInfoCb)
    );

    return emailValidator;
  }

  public getPasswordValidator(passwordForm: AbstractControl): FormValidator {
    const passwordValidator = new FormValidator(passwordForm);

    passwordValidator
      .get('password')
      ?.setValidatorEntries([
        new ControlValidatorEntry(
          'required',
          'Ingrese una contraseña',
          () => Validators.required
        ),
      ]);

    passwordValidator
      .get('repeatPassword')
      ?.setValidatorEntries([
        new ControlValidatorEntry(
          'passwordsMatch',
          'Las contraseñas ingresadas no coinciden',
          this.getPasswordsMatchValidatorFn()
        ),
      ]);

    return passwordValidator;
  }

  public getRegisterValidator(registerForm: AbstractControl): FormValidator {
    const registerValidator = this.getPasswordValidator(registerForm);

    registerValidator
      .get('fullname')
      ?.setValidatorEntries(...this.getFullNameValidatorEntries());

    registerValidator
      .get('email')
      ?.setValidatorEntries(...this.getEmailValidatorEntries());

    return registerValidator;
  }
}
