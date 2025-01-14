import { Component, OnInit, Input, EventEmitter, Output, ViewChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { CrudService } from 'src/app/shared/services/crud.service';
import { LocalStoreService } from 'src/app/shared/services/local-store.service';

function numericValidator(control: AbstractControl): ValidationErrors | null {
  if (control.value && !/^[0-9]+$/.test(control.value)) {
    return { numeric: true };
  }
  return null;
}

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss', '../../../css/custpm-dropdown-style.scss']
})
export class CreateUserComponent implements OnInit {
  @Input() mode: string = 'create';
  @Input() userData: any;
  @Output() successCall = new EventEmitter<void>();
  @Input() userId: number = 0;
  @Input() itemList: any;
  @ViewChild('dropDownModel', { static: true }) dropDownModel!: TemplateRef<any>;

  isPasswordVisible: boolean = false;
  userForm!: FormGroup;
  hidePassword = true;
  isFocused: boolean = false;
  roleList: any = [];
  organization: any = [];
  isLoading: boolean = false;
  updateMode: boolean = false;
  allRoles: any[] = [];
  status: string = '';
  tempStatus: string = '';
  modalRef?: BsModalRef;
  isFirstModalOpen: boolean = true;

  constructor(
    private bsModalService: BsModalService,
    private fb: FormBuilder,
    private crudService: CrudService,
    private toast: ToastrService,
    public localStoreService: LocalStoreService,
  ) { }

  ngOnInit(): void {
    this.initialize();

    if (this.localStoreService.getUserRole().toLowerCase() === 'master') {
      this.fetchOrganization();
      if (this.mode === 'update') {
        this.fetchRoles(this.userData.organization.id);
      }
    } else {
      this.fetchRoles(parseInt(this.localStoreService.getUserOrganization()));
    }

  }

  initialize() {
    this.userForm = this.fb.group({
      firstName: [null, Validators.required],
      lastName: [null, Validators.required],
      username: [null, Validators.required],
      phone: ['', [Validators.required, numericValidator]],
      email: [null, [Validators.required, Validators.email]],
      password: [null, [Validators.required, Validators.minLength(8)]],
      roles: [[], Validators.required],
      organization: [null, Validators.required],
      status: [null,]
    });

    if (this.mode === 'update' && this.userData) {
      this.userForm.get('organization')?.clearValidators();
      this.userForm.get('roles')?.clearValidators();
      this.updateMode = true;
      this.tempStatus = this.userData.status;

      this.userForm.patchValue({
        firstName: this.userData.first_name || '',
        lastName: this.userData.last_name || '',
        username: this.userData.username || '',
        phone: this.userData.phone || '',
        email: this.userData.email || '',
        roles: [],
        organization: this.userData.organization ? this.userData.organization.id : '',
        status: this.userData.status || 'active'
      });

      this.userForm.get('email')?.disable();
      this.userForm.removeControl('password');

    } else {
      this.userForm.get('organization')?.setValidators(Validators.required);
      this.userForm.get('roles')?.setValidators(Validators.required);
    }
  }

  onStatusChange(status: string): void {
    this.tempStatus = this.userData.status || 'active';

    if (status !== 'active') {
      this.isFirstModalOpen = false;
      this.userForm.get('status')?.setValue(status);
      this.modalRef = this.bsModalService.show(this.dropDownModel, {
        class: 'modal-dialog modal-dialog-centered',
        keyboard: false,
        backdrop: 'static'
      });
    } else {
      this.isFirstModalOpen = true;
      this.userForm.get('status')?.setValue(status);
    }
  }

  handleModalResponse(confirm: boolean): void {
    if (!confirm) {
      this.userForm.get('status')?.setValue(this.tempStatus);
    }
    if (this.modalRef) {
      this.modalRef.hide();
    }
  }


  isControlHasError(controlName: string, validationType: string): boolean {
    const control = this.userForm.controls[controlName];
    if (!control) {
      return false;
    }
    return control.hasError(validationType) && (control.dirty || control.touched);
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  generatePassword(): void {
    const length = 12;
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digits = "0123456789";
    const specialChars = "!@#$%^&*()";
    let password = "";
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += digits[Math.floor(Math.random() * digits.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];
    const allChars = lowercase + uppercase + digits + specialChars;
    for (let i = 4; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * allChars.length);
      password += allChars[randomIndex];
    }
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    this.userForm.get('password')?.setValue(password);
  }

  onSubmit(): void {

    if (this.localStoreService.getUserRole().toLowerCase() !== 'master') {
      this.userForm.patchValue({
        organization: this.localStoreService.getUserOrganization()
      });
    }

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const formValue = { ...this.userForm.value };

    if (!formValue.status) {
      formValue.status = 'active';
    }

    if (formValue.organization) {
      formValue.organization = Number(formValue.organization);
    }

    const endpoint = 'users';
    const apiMethod = this.mode === 'create'
      ? this.crudService.create(endpoint, formValue)
      : this.crudService.update(endpoint, this.userData?.id, formValue);

    this.isLoading = true;
    apiMethod.subscribe(
      (response: any) => {
        if (response.status_code === 200 || response.status_code === 201) {
          this.toast.success(response.message, 'Success!');
          this.successCall.emit();
          this.closeModalUser();
        } else {
          this.toast.error(response.message, 'Error!');
          this.isLoading = false;
        }
      },
      error => {
        this.toast.error(error.message || 'An error occurred', 'Error!');
        this.isLoading = false;
      }
    );
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.hide();
    }
  }

  closeModalUser(): void {
    this.bsModalService.hide();
  }



  onValueChange(): void {
    this.updateMode = false;
    const control = this.userForm.get('roles');
    if (control?.value) {
      this.isFocused = false;
      this.filterSelectedRoles();
    }
  }

  fetchRoles(organizationId: number): void {
    this.roleList = [];

    const urlData = 'access/roles?organization=' + organizationId;
    this.crudService.read(urlData)
      .subscribe(
        (response: any) => {
          if (response.status_code === 200) {
            this.allRoles = response.data.payload;
            this.filterSelectedRoles();
          } else {
            console.error('Failed to fetch roles:', response.message);
          }
        },
        error => {
          console.error('Error fetching roles:', error);
        }
      );
  }

  filterSelectedRoles(): void {
    const selectedRoles = this.userForm.get('roles')?.value || [];
    this.roleList = this.allRoles.filter((role: any) => !selectedRoles.includes(role.id));
    if(this.mode === "update" && this.updateMode === true){
      const rolesData = this.userData.roles.map((role: any) => role.id);
      this.userForm.patchValue({
        roles: rolesData
      })
    }
  }

  restoreRoles(): void {
    this.roleList = [...this.allRoles];
  }

  fetchOrganization(): void {
    this.crudService.read('organization')
      .subscribe(
        (response) => {
          this.organization = response.data.payload;
        },
        error => {
          console.error('Error fetching organizations:', error);
        }
      );
  }

  onChange(): void {
    const control = this.userForm.get('organization');
    if (control?.value) {
      this.isFocused = false;
      this.userForm.patchValue({
        roles: []
      });
      this.fetchRoles(control.value);
    }
  }

  getPasswordErrors(): { [key: string]: boolean } {
    const errors: { [key: string]: boolean } = {
      required: false,
      minlength: false,
      uppercase: false,
      lowercase: false,
      digit: false,
      special: false
    };

    const passwordControl = this.userForm.get('password');
    if (!passwordControl) return errors;

    const password = passwordControl.value;

    if (passwordControl.hasError('required')) {
      errors['required'] = true;
    }
    if (passwordControl.hasError('minlength')) {
      errors['minlength'] = true;
    }
    if (password && !/[A-Z]/.test(password)) {
      errors['uppercase'] = true;
    }
    if (password && !/[a-z]/.test(password)) {
      errors['lowercase'] = true;
    }
    if (password && !/\d/.test(password)) {
      errors['digit'] = true;
    }
    if (password && !/\W/.test(password)) {
      errors['special'] = true;
    }

    return errors;
  }
}
