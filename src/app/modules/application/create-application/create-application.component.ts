import { Component, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { CrudService } from 'src/app/shared/services/crud.service';
import { LocalStoreService } from 'src/app/shared/services/local-store.service';

@Component({
  selector: 'app-create-application',
  templateUrl: './create-application.component.html',
  styleUrls: ['./create-application.component.scss', '../../../css/custpm-dropdown-style.scss']
})
export class CreateApplicationComponent implements OnInit {
  modalRef: any;
  applicationForm!: FormGroup
  modalOpen: boolean = false;
  inputUris: Array<{ value: string }> = [];
  @Output() successCall = new EventEmitter();
  organization: any[] = [];
  isFocused: boolean = false;
  @Input() itemList: any;
  @Input() organizationId: number | undefined;
  @Input() title: string = '';
  isLoading: boolean = false;
  applicationID: any;

  constructor(
    private modalService: BsModalService,
    private crudService: CrudService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastrService,
    public localStoreService: LocalStoreService
  ) { }

  ngOnInit(): void {

    if (this.localStoreService.getUserRole().toLowerCase() === 'master') {
      this.fetchOrganization();
    }

    this.initialize();
  }

  onChange(): void {
    const control = this.applicationForm.get('organization');
    if (control?.value) {
      this.isFocused = false;
    }
  }
  initialize() {
    this.applicationForm = new FormGroup({
      app_name: new FormControl('', [Validators.required]),
      url: new FormControl('',[Validators.required, this.domainValidator()]),
      organization: new FormControl('', [Validators.required]),
      redirectUri: new FormArray([]),
    });



    if (this.itemList && typeof this.itemList === 'object') {
      this.applicationForm.patchValue({
        app_name: this.itemList.app_name,
        url: this.itemList.url,
        organization: this.itemList.organization.id
      });

      const redirectUriArray = this.applicationForm.get('redirectUri') as FormArray;

      redirectUriArray.clear();

      if (this.itemList.redirect_uri && Array.isArray(this.itemList.redirect_uri)) {
        this.itemList.redirect_uri.forEach((uri: any) => {
          redirectUriArray.push(new FormControl(uri));
        });
      }
    }
  }
  get urlControl() {
    return this.applicationForm.get('url');
  }


  closeModal(): void {
    this.modalService.hide();
  }

  isControlHasError(controlName: any, validationType: string): boolean {
    const control = this.applicationForm.controls[controlName];
    if (!control) {
      return false;
    }
    return (
      control.hasError(validationType) && (control.dirty || control.touched)
    );
  }

  get redirectUriArray(): FormArray {
    return this.applicationForm.get('redirectUri') as FormArray;
  }


  addInputUri() {
    this.redirectUriArray.push(new FormControl(''));
  }
  resetInputs(): void {
    this.redirectUriArray.clear();
    this.inputUris = [];
    this.addInputUri();
  }
  fetchOrganization(): void {
    this.crudService.read('organization')
      .subscribe(
        (response) => {
          this.organization = response.data.payload

        },
        error => {
          console.error('Error fetching roles:', error);
        }
      );
  }
  removeInputUri(index: number) {
    if (this.redirectUriArray.length > 1) {
      this.redirectUriArray.removeAt(index);
    }
  }

  onUriInputChange(index: number) {
    const control = this.redirectUriArray.at(index) as FormControl;
    if (!control.value && this.redirectUriArray.length > 1) {
      this.removeInputUri(index);
    }
  }
  onSubmit() {
    if(this.localStoreService.getUserRole().toLowerCase() !== 'master'){
      this.applicationForm.patchValue({
        organization: this.localStoreService.getUserOrganization()
      });
    }

    if (this.applicationForm.invalid) {
      this.applicationForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const createData = this.applicationForm.value;

    if (this.title === 'Create') {
      this.crudService.create('applications', createData).subscribe(
        (response: any) => {
          if (response.status_code === 200 || response.status_code === 201) {
            this.toast.success(response.message, "Success!");
            if (response.data && typeof response.data === 'object') {
              this.router.navigate(['layout/application/details/' + response.data.id]);
              // this.applicationID = response.data.id
              this.successCall.emit();
              this.closeModal();
            }
          }
        },
        error => {
          this.isLoading = false; // Hide loader on error
          this.toast.error(error.message, "Error!");
          console.error('HTTP error:', error);
        },
        () => {
          this.isLoading = false; // Hide loader on complete
        }
      );
    } else if (this.title === 'Edit') {
      this.crudService.update('applications', this.applicationID, createData).subscribe(
        (response: any) => {
          if (response.status_code === 200 || response.status_code === 201) {
            this.toast.success(response.message, "Success!");
            this.successCall.emit();
            this.closeModal();
          }
        },
        error => {
          this.isLoading = false; // Hide loader on error
          this.toast.error(error.message, "Error!");
          console.error('HTTP error:', error);
        }
      );
    }
  }

   domainValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) {
        return null; // Don't validate empty values
      }

      const domainPattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
      const isValidDomain = domainPattern.test(control.value);

      return isValidDomain ? null : { invalidDomain: 'Please enter Domain name' };
    };
  }




}
