import {
  Component,
  OnInit,
  Inject,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
} from '@angular/forms';
import { Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { cloneDeep } from 'lodash';

import {
  AppRegExp,
  CustomValidators,
  FormValidator,
  ControlValidatorEntry,
} from '../../appValidators';

import { User } from '../../../models/user/user.model';

@Component({
  selector: 'app-user-new-edit-dialog-wrapper',
  template: ` <app-user-new-edit
    [user]="inputData.element"
    (close)="close($event)"
  >
  </app-user-new-edit>`,
  styleUrls: ['./user-new-edit.component.scss'],
})
export class UserNewEditDialogWrapperComponent {
  inputData;

  constructor(
    public dialogRef: MatDialogRef<UserNewEditDialogWrapperComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any
  ) {
    this.inputData = dialogData;
  }

  public close(user: any) {
    this.dialogRef.close(user);
  }
}

@Component({
  selector: 'app-user-new-edit',
  templateUrl: './user-new-edit.component.html',
  styleUrls: ['./user-new-edit.component.scss'],
})
export class UserNewEditComponent implements OnInit {
  @Input() user!: User;
  @Output() close = new EventEmitter();

  checkoutForm!: UntypedFormGroup;
  formValidator!: FormValidator;
  rolesDescriptors: any[] = User.rolesDescriptors;
  private valueEmitted: boolean = false;

  constructor(private formBuilder: UntypedFormBuilder) {}

  ngOnInit() {
    this.initializeUser();
    this.initializeForm();
  }

  private initializeUser() {
    this.user = this.user ? cloneDeep(this.user) : new User();
  }

  private initializeForm() {
    this.initializeFormGroup();
    this.initializeFormValidator();
    this.updateFormFromInput();
    this.subscribeToChanges();
  }

  private initializeFormGroup() {
    this.checkoutForm = this.formBuilder.group({
      email: null,
      fullname: null,
      roles: this.formBuilder.array([]),
    });
  }

  private initializeFormValidator() {
    this.formValidator = new FormValidator(this.checkoutForm);
    this.formValidator
      .get('email')
      ?.setValidatorEntries([
        new ControlValidatorEntry(
          'required',
          'Requerido',
          () => Validators.required
        ),
        new ControlValidatorEntry(
          'email',
          'Ingrese un email válido',
          () => Validators.email
        ),
      ]);
    this.formValidator
      .get('fullname')
      ?.setValidatorEntries([
        new ControlValidatorEntry(
          'required',
          'Requerido',
          () => Validators.required
        ),
        new ControlValidatorEntry(
          'onlyLetters',
          `Solo letras, números o "."`,
          CustomValidators.regexValidator,
          AppRegExp.onlyAlphaNumericsOrPunctuation
        ),
      ]);
  }

  private updateFormFromInput() {
    this.checkoutForm.patchValue({
      email: this.user.email,
      fullname: this.user.fullname,
    });
    User.rolesDescriptors?.forEach((rd: any) => {
      this.roles.push(
        this.formBuilder.control(
          Boolean(this.user.roles?.find((role: string) => role === rd.key))
        )
      );
    });
  }

  private subscribeToChanges() {
    this.checkoutForm
      .get('email')
      ?.valueChanges.subscribe((email: string) => (this.user.email = email));
    this.checkoutForm
      .get('fullname')
      ?.valueChanges.subscribe(
        (fullname: string) => (this.user.fullname = fullname)
      );
    this.checkoutForm
      .get('roles')
      ?.valueChanges.subscribe((roles: boolean[]) => this.updateRoles(roles));
  }

  private updateRoles(roles: boolean[]) {
    this.user.roles = User.rolesDescriptors
      .filter((rd: any, index: number) => roles[index])
      .map((rd: any) => rd.key);
  }

  get roles() {
    return this.checkoutForm.get('roles') as UntypedFormArray;
  }

  get userIsNew(): boolean {
    return (this.user as any).isNew();
  }

  get disableSubmitButton(): boolean {
    return this.valueEmitted || !this.checkoutForm.valid;
  }

  onSubmit() {
    (this.user as any).save().subscribe((user: any) => {
      this.user._id = user._id;
      this.close.emit(this.user);
    });
    this.valueEmitted = true;
  }
}
