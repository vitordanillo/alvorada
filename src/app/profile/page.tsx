import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { getProfileAction } from '@/lib/profile-actions';
import { ProfilePanel } from '@/components/profile/profile-panel';

export default async function ProfilePage(){
  if(!(await currentUser()))redirect('/');
  return <ProfilePanel initialProfile={await getProfileAction()}/>;
}
