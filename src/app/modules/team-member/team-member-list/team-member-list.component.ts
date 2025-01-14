import { Component, OnInit } from '@angular/core';
import { InviteMemberComponent } from '../invite-member/invite-member.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { CrudService } from 'src/app/shared/services/crud.service';
import { LocalStoreService } from 'src/app/shared/services/local-store.service';

@Component({
  selector: 'app-team-member-list',
  templateUrl: './team-member-list.component.html',
  styleUrls: ['./team-member-list.component.scss']
})
export class TeamMemberListComponent implements OnInit {
  columns: any[] = [];
  modalRef?: BsModalRef;
  searchTerm: string = '';
  filterData: any[] = [];
  searchType: boolean = false;
  teamMemberList: any[] = [];
  tableConfig: any = {};

  currentPage: number = 1;
  pageSize: number = 10;

  constructor(
    private modalService: BsModalService,
    private crudService: CrudService,
    public localStoreService: LocalStoreService,
  ) { }

  ngOnInit(): void {
    this.memberListing();
  }

  createMember() {
    this.modalRef = this.modalService.show(InviteMemberComponent, {
      class: 'modal-dialog modal-dialog-centered modal-md common_modal_shadow',
      backdrop: 'static',
      keyboard: false
    });

    // Uncomment if you want to reload member list after a successful invitation
    // this.modalRef.content.successCall.subscribe(() => {
    //   this.memberListing();
    // });
  }

  memberListing(page: number = this.currentPage, search: string = this.searchTerm) {
    // const url = `member?page=${page}&pageSize=${this.pageSize}&search=${search}`;
    let urlData = `member?page=${page}&limit=10`;
    if(this.localStoreService.getUserRole().toLowerCase() !== 'master'){
      urlData += `&organization=${this.localStoreService.getUserOrganization()}`;
    }

    if(this.searchType){
      urlData += `&search=${this.searchTerm}`;
    }
    this.crudService.read(urlData).subscribe((response: any) => {
      if (response.status_code === 200 || response.status_code === 201) {
        if (response.data.payload.length > 0) {
          const column = Object.keys(response.data.payload[0]);
          this.columns = column.filter((col: string) =>
            !['id', 'email_verified', 'permissions', 'timezone', 'username', 'updated_at', 'profile_picture', 'last_name'].includes(col)
          );
          this.teamMemberList = response.data.payload;
          this.filterData = this.teamMemberList;

          this.tableConfig = {
            paginationParams: {
              total_pages: response.data.paginate_options.total_pages,
              payload_size: response.data.paginate_options.payload_size,
              has_next: response.data.paginate_options.has_next,
              current_page: response.data.paginate_options.current_page,
              skipped_records: response.data.paginate_options.skipped_records,
              total_records: response.data.paginate_options.total_records
            }
          };
        
      
    } else {
          this.teamMemberList = [];
      this.filterData = [];
    }
      }
    }, error => {
      console.error('HTTP error:', error);
    });
  }

  onKeyChange(item: any) {
    this.searchType = false;

    if (item.keyCode == 13) {
      this.searchType = true;
      this.memberListing(1);
    } else if (this.searchTerm == '') {
      this.memberListing(1);
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.memberListing(this.currentPage, this.searchTerm);
  }
}
