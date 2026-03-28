import { useAuth } from "@client/entities/auth";
import { useNotification } from "@client/entities/notification";

export const AuthComposer = () => {
  const auth = useAuth()
  const { add } = useNotification()

  const onCopyUUID = () => {
    if (auth == null) return
    
    void navigator.clipboard.writeText(auth).then(
      () => add("UUID copied to clipboard", "success"),
      () => add("Failed to copy UUID", "error"),
    )
  };

  return <div>
    <h1>Welcome to the Authentication</h1>
    <p>Your auth uuid is: {auth}</p>
    <p>Share this uuid with your friend to start a video call</p>
    <button onClick={(onCopyUUID)}>Copy UUID</button>
  </div>;
};
