import * as React from "react";
import "react-native-gesture-handler";
import "react-native-url-polyfill/auto";

const MemberHandlerContext = React.createContext(null);

export function useMemberHandler() {
  const context = React.useContext(MemberHandlerContext);
  // Return safe defaults if context is null (not wrapped in provider)
  if (!context) {
    return {
      firstName: "",
      lastName: "",
      phone: "",
      currentMember: null,
      updateContact: () => {},
    };
  }
  return context;
}

export function MemberHandler(props) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [currentMember, setCurrentMember] = React.useState(null);

  const updateContact = React.useCallback((contact) => {
    if (contact.firstName !== undefined) setFirstName(contact.firstName);
    if (contact.lastName !== undefined) setLastName(contact.lastName);
    if (contact.phone !== undefined) setPhone(contact.phone);
  }, []);

  return (
    <MemberHandlerContext.Provider
      value={{ updateContact, currentMember, firstName, lastName, phone }}
    >
      {props.children}
    </MemberHandlerContext.Provider>
  );
}
