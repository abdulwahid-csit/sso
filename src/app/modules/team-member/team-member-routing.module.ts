import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TeamMemberListComponent } from './team-member-list/team-member-list.component';
import { TeamMemberDetailComponent } from './team-member-detail/team-member-detail.component';
import { NotFoundComponent } from 'src/app/shared/components/not-found/not-found.component';
// import { RegisterMemberComponent } from './register-member/register-member.component';

const routes: Routes = [
  {path:'',component: TeamMemberListComponent},
  {path:'details/:id',component: TeamMemberDetailComponent},
  {path:'**', component:NotFoundComponent},
  // {path:'register',component: RegisterMemberComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TeamMemberRoutingModule { }
