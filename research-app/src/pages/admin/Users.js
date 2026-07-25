import { useState } from "react";
import { userService } from "../../services/userService";
import PaginatedRenderer from "../../components/utils/Pagination";

const IsTrueElement = ({ bool }) => {
    return bool ? (
        <i class="fa fa-check text-success" aria-hidden="true" />
    )
        :
        (
            <i class="fa fa-times text-danger" aria-hidden="true" />
        )
}

const Users = () => {
    const [errorMessage, setErrorMessage] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [itemData, setItemData] = useState({
        name: '',
        email: '',
        isAdmin: false,
        researcherId: null
    });
    const [edit, setEdit] = useState({
        name: false,
        email: false,
        isAdmin: false,
        researcherId: false
    });

    const changeItem = (item) => {
        setSelectedItem(item);
        setErrorMessage(null);
        setConfirmDelete(false);
        setEdit({
            name: false,
            email: false,
            isAdmin: false,
            researcherId: false
        });

        if (item !== null) {
            setItemData({
                name: item.name || '',
                email: item.email || '',
                isAdmin: item.isAdmin || false,
                researcherId: item.researcherId || null
            });
        }
    }

    const handleSaveChanges = async (e, id, updatedData) => {
        e.preventDefault();
        try {
            const formData = {
                name: updatedData.name,
                email: updatedData.email,
                isAdmin: updatedData.isAdmin || false,
                researcherId: updatedData.researcherId || null
            };

            const response = await userService.updateUser(id, formData);

            if (response.success) {
                changeItem(null);
            } else {
                setErrorMessage(response.message || 'Failed to save changes');
            }
        } catch (err) {
            setErrorMessage('An error occurred while saving changes');
        }
    }

    const handleDeleteUser = async (e, id) => {
        e.preventDefault()

        try {

            const response = await userService.deleteUser(id);
            if (response.success) {
                changeItem(null);
            } else {
                setErrorMessage("An error occurred while deleting user")
            }

        } catch (error) {

            setConfirmDelete(false);
            setErrorMessage('An error occurred while deleting');
        }
    }

    const UserTableContainer = ({ children }) => {
        return (
            <div className="row row-cols-1 text-center">
                <div className="col qut-bg-tertiary border p-3 d-grid">
                    <div className="row">
                        <span className="col-sm-3 border-end">Name</span>
                        <span className="col-sm-3 border-end">Email</span>
                        <span className="col-sm-3 border-end">Researcher</span>
                        <span className="col-sm-2">Admin</span>
                    </div>
                </div>
                {children}
            </div>
        )
    }

    const UserTableRow = ({ content }) => {
        return (
            <div className="col qut-bg-secondary border p-3 d-grid">
                <div className="row">
                    <span className="col-sm-3 border-end">{content.name}</span>
                    <span className="col-sm-3 border-end">{content.email}</span>
                    <span className="col-sm-3 border-end"><IsTrueElement bool={content.researcherId !== undefined} /></span>
                    <span className="col-sm-2 border-end"><IsTrueElement bool={content.isAdmin} /></span>
                    <span className="col-sm-1"><i class="fa fa-cog text-qut-light-blue clickable" aria-hidden="true" onClick={() => changeItem(content)} /></span>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen qut-bg-primary">
            <div className="qut-bg-primary shadow-lg sticky-top p-3 qut-text-primary">
                <h2>User Manager</h2>
            </div>

            <div className="p-5">
                <div className="d-flex flex-column mb-3 gap-3">
                    <PaginatedRenderer
                        maxDataPerPage={20}
                        OuterRenderer={UserTableContainer}
                        InnerRenderer={UserTableRow}
                        serviceFunction={userService.getUsers}
                        refreshTrigger={selectedItem}
                    />
                    {confirmDelete && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4">
                            <div className="qut-bg-primary rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto mt-16">
                                <div className="p-6 border-b flex gap-40 items-start">
                                    <h2 className="font-bold qut-text-primary" style={{ fontSize: '1.5rem', lineHeight: '2rem' }}>
                                        Confirm Deletion
                                    </h2>
                                </div>
                                <div className="p-6">

                                    <div className="flex gap-3 pt-4">

                                        <button
                                            onClick={() => setConfirmDelete(false)}
                                            className="px-4 py-2 qut-bg-secondary qut-text-primary rounded-lg hover:qut-bg-tertiary"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            onClick={(e) => handleDeleteUser(e, selectedItem._id)}
                                            className="px-4 py-2 bg-danger qut-text-primary rounded-lg hover:qut-bg-tertiary"

                                        >
                                            Delete Researcher
                                        </button>

                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {(selectedItem && !confirmDelete) && selectedItem && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4">
                            <div className="qut-bg-primary rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto mt-16">
                                <div className="p-6 border-b flex gap-40 items-start">

                                    <div className="relative max-w-md">
                                        <input
                                            type="text"
                                            className="font-bold qut-text-primary w-full pr-10"
                                            id="name-input"
                                            style={{
                                                background: "none",
                                                fontSize: "1.5rem",
                                                lineHeight: "2rem",
                                                width: `${Math.max(itemData.name.length + (itemData.name.length / 5), 16)}ch`,
                                            }}
                                            value={itemData.name}
                                            disabled={!edit.name}
                                            onChange={(e) =>
                                                setItemData({ ...itemData, name: e.target.value })
                                            }
                                        />

                                        <button
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-blue-600"
                                            onClick={() => {
                                                setEdit(prev => ({ ...prev, name: !prev.name }))
                                                document.getElementById('name-input').style.border = edit.name ? 'none' : '1px solid #3b82f6';
                                            }}
                                        >
                                            ✎
                                        </button>
                                    </div>

                                    <div className="relative max-w-md flex items-center gap-3">
                                        <h4 className="qut-text-primary mr-3">Admin:</h4>

                                        <input
                                            type="checkbox"
                                            className="w-5 h-5"
                                            checked={itemData.isAdmin}
                                            disabled={!edit.isAdmin}
                                            onChange={(e) =>
                                                setItemData({ ...itemData, isAdmin: e.target.checked })
                                            }
                                        />
                                        <button
                                            className="ml-auto text-gray-500 hover:text-blue-600"
                                            onClick={() => {
                                                setEdit(prev => ({ ...prev, isAdmin: !prev.isAdmin }))
                                            }}
                                        >
                                            ✎
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6">

                                    <div className="p-6 flex flex-col gap-8 items-start">
                                        <h3 className="text-lg font-semibold qut-text-primary">Email</h3>
                                        <div className="relative max-w-md">

                                            <input
                                                type="text"
                                                className="qut-text-tertiary"
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    fontSize: "1rem",
                                                    lineHeight: "2rem",
                                                    width: `${Math.max(itemData.email.length + (itemData.email.length / 5), 16)}ch`
                                                }}
                                                value={itemData.email}
                                                id="email-input"
                                                placeholder="Email"
                                                onChange={(e) =>
                                                    setItemData({ ...itemData, email: e.target.value })
                                                }
                                                disabled={!edit.email}
                                            />

                                            <button
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-blue-600"
                                                onClick={() => {
                                                    setEdit(prev => ({ ...prev, email: !prev.email }))
                                                    document.getElementById('email-input').style.border = edit.email ? 'none' : '1px solid #3b82f6';
                                                }}
                                            >
                                                ✎
                                            </button>
                                        </div>
                                        <h3 className="text-lg font-semibold qut-text-primary">Researcher ID</h3>
                                        <div className="relative max-w-md">

                                            <input
                                                type="text"
                                                className="qut-text-tertiary"
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    fontSize: "1rem",
                                                    lineHeight: "2rem",
                                                    width: `28ch`
                                                }}
                                                value={itemData.researcherId}
                                                id="researcher-id-input"
                                                placeholder="Researcher ID"
                                                onChange={(e) =>
                                                    setItemData({ ...itemData, researcherId: e.target.value })
                                                }
                                                disabled={!edit.researcherId}
                                            />

                                            <button
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-blue-600"
                                                onClick={() => {
                                                    setEdit(prev => ({ ...prev, researcherId: !prev.researcherId }))
                                                    document.getElementById('researcher-id-input').style.border = edit.researcherId ? 'none' : '1px solid #3b82f6';
                                                }}
                                            >
                                                ✎
                                            </button>
                                        </div>

                                    </div>
                                    {errorMessage && (
                                        <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-200 w-full max-w-md" role="alert">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-4 border-t">

                                        <button
                                            onClick={() => changeItem(null)}
                                            className="px-4 py-2 qut-bg-secondary qut-text-primary rounded-lg hover:qut-bg-tertiary"
                                        >
                                            Close
                                        </button>

                                        <button
                                            onClick={() => {
                                                setItemData(selectedItem.data)

                                            }
                                            }
                                            className="px-4 py-2 qut-bg-secondary qut-text-primary rounded-lg hover:qut-bg-tertiary"
                                        >
                                            Reset
                                        </button>

                                        <button

                                            className="px-4 py-2 qut-bg-secondary qut-text-primary rounded-lg hover:qut-bg-tertiary"
                                            onClick={(e) => handleSaveChanges(e, selectedItem._id, itemData)}
                                        >
                                            Save Changes
                                        </button>
                                        {!confirmDelete && (
                                            <button
                                                onClick={(e) => setConfirmDelete(true)}
                                                className="px-4 py-2 qut-bg-secondary qut-text-primary rounded-lg hover:qut-bg-tertiary"

                                            >
                                                Delete User
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Users;