import CollaborativeRoom from '@/components/CollaborativeRoom'
import { getDocument } from "@/lib/actions/room.actions";
import { getClerkUsers } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation";


interface SearchParamProps {
  params: {
    id: string;
  };
}

interface User {
  id: string;
  email: string | null;
  // Add other properties as needed
}


type UserType = 'editor' | 'viewer';

const Document = async ({ params: { id } }: SearchParamProps) => {
  const clerkUser = await currentUser();
  if(!clerkUser || !clerkUser.emailAddresses[0]?.emailAddress) redirect('/sign-in');

  const userEmail = clerkUser.emailAddresses[0].emailAddress;

  const room = await getDocument({
    roomId: id,
    userId:userEmail
  });

  if(!room) redirect('/');

  const userIds = Object.keys(room.usersAccesses);
  const users = await getClerkUsers({ userIds });

  const usersData = users.map((user: User | null) => {
    if (!user || !user.email) {
      console.warn(`User does not have an email address`);
      return {
        ...user,
        userType: 'viewer' as UserType // Default to viewer if email is missing
      };
    }
  
    return {
      ...user,
      userType: room.usersAccesses[user.email]?.includes('room:write')
        ? 'editor' as UserType
        : 'viewer' as UserType
    };
  })

  const currentUserType: UserType = room.usersAccesses[clerkUser.emailAddresses[0].emailAddress]?.includes('room:write') ? 'editor' : 'viewer';

  return (
    <main className="flex w-full flex-col items-center">
      <CollaborativeRoom 
        roomId={id}
        roomMetadata={room.metadata}
        users={usersData}
        currentUserType={currentUserType}
      />
    </main>
  )
}

export default Document