import React from "react";
import PropTypes from 'prop-types';

export const UserContext = React.createContext();
export const UserProvider = ({ children }) => {
    const [user, setUser] = React.useState(null);
    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

UserProvider.propTypes = {
    children: PropTypes.node,
};