import { defineStore } from 'pinia'
import axios from 'axios';
import { useSettingsStore } from '../stores/settings';

const BASE_URL = import.meta.env.VITE_BACKEND_URL ? import.meta.env.VITE_BACKEND_URL : 'https://bookminder.io';
const API_URL = BASE_URL + '/libraries';

function updateInPlace(array, destinationObject) {
    console.log("updateInPlace: ", array, destinationObject);
    array.forEach(item => {
        let index = destinationObject.filter(obj => obj.id === item.id);
        if (index != -1) {
            destinationObject[index] = item;
        } else {
            destinationObject.push(item);
        }
    });
}

export const useLibrariesStore = defineStore('libraries', {
    state: () => ({
        allLibraries: [],
        globalLibraries: [],
        userLibraries: [],
        myLibraries: [],
        recentlyAdded: [],
        reading: [],
        allBooks: [],
        booksLibraries: {},
        lastBookTimestamp: null,
        allAuthors: [],
        lastAuthorTimestamp: null,
    }),
    actions: {
        async getMyLibraries(userId, returnData=false) {
            let result = await axios.get(`${API_URL}/my-libraries`, {
                params: { userId },
                withCredentials: true
            });
            if (result.status === 200) {
                if (!returnData) {
                    this.myLibraries = result.data;
                } else {
                    return result.data;
                }
                
            }
        },
        async getRecentlyAdded() {
            let result = await axios.get(`${API_URL}/recently-added`, { withCredentials: true });
            if (result.status === 200) {
                // Sort libraries by most recent book 'added' timestamp
                const sorted = [...result.data].sort((a, b) => {
                    const maxA = Array.isArray(a.books) ? Math.max(...a.books.map(x => x.added || 0)) : 0;
                    const maxB = Array.isArray(b.books) ? Math.max(...b.books.map(x => x.added || 0)) : 0;
                    return maxB - maxA;
                });
                // Respect optional user setting for max rows
                const settingsStore = useSettingsStore();
                const maxRows = settingsStore?.homeDisplay?.maxRecentlyAdded || sorted.length;
                this.recentlyAdded = sorted.slice(0, maxRows);
            }
        },
        async getAllBooks(libraryId) {

            let timestamp = null;
            if (libraryId) {
                libraryId = libraryId.toString();
                timestamp = this.booksLibraries[libraryId] ? this.booksLibraries[libraryId]['lastTimestamp'] : null;
            } else {
                timestamp = this.lastBookTimestamp != 0 ? this.lastBookTimestamp : null;
            }

            let result = await axios.get(`${API_URL}/all-books`, {
                params: { libraryId },
                withCredentials: true
            });
            if (result.status === 200) {
                if (libraryId) {
                    if (!this.booksLibraries[libraryId]) {
                        this.booksLibraries[libraryId] = {};
                    }
                    this.booksLibraries[libraryId]['books'] = result.data;
                } else {   
                    this.allBooks = result.data;
                }
            }   
        },
        async getAllAuthors() {
            let result = await axios.get(`${API_URL}/all-authors`, {
                params: { lastTimestamp: this.lastAuthorTimestamp },
                withCredentials: true
            });
            if (result.status === 200) {
                let timestamp = result.data.filter(author => author.updated).reduce((max, author) => Math.max(max, author.updated), null);
                if (this.lastAuthorTimestamp == 'asdf') {
                    updateInPlace(result.data, this.allAuthors);
                    this.lastAuthorTimestamp = timestamp;
                } else {
                    this.allAuthors = result.data;
                    this.lastAuthorTimestamp = timestamp;
                }
            }
        },

        async getReading() {
            let result = await axios.get(`${API_URL}/reading`, { withCredentials: true });
            if (result.status === 200) {
                this.reading = result.data;
            }
        },    
        async setProgress(bookId, progress) {
            let result = await axios.post(`${API_URL}/progress`, 
                {
                    bookId: bookId,
                    progress: progress
                },
                {withCredentials: true}
            );
            if (result.status === 200) {
                return result.data;
            }
        },
        async getBookUrl(libraryId, bookId, formatId) {
            let result = await axios.get(`${API_URL}/book-url`, {
                params: { libraryId, bookId, formatId },
                withCredentials: true
            });
            if (result.status === 200) {
                return result.data;
            }
        },    
        async getGlobalLibraries(username, returnData=false) {
            let result = await axios.get(`${API_URL}/global-libraries`, {
                params: { username },
                withCredentials: true
            });
            if (result.status === 200) {
                if (!username && !returnData) {
                    this.globalLibraries = result.data;
                } else {
                    return result.data;
                }
            }
        },  
        async getUserLibraries(username, returnData=false) {
            let result = await axios.get(`${API_URL}/user-libraries`, {
                params: { username },
                withCredentials: true
            });
            if (result.status === 200) {
                if (!username && !returnData) {
                    this.userLibraries = result.data;
                } else {
                    return result.data;
                }
            }
        },          
        async getAllLibraries(username) {
            let result = await axios.get(`${API_URL}/all-libraries`, {
                params: { username },
                withCredentials: true
            });
            if (result.status === 200) {
                if (!username) {
                    this.allLibraries = result.data;
                } else {
                    return result.data;
                }
            }
        },          
        async saveGlobalLibrariesAccess(username, changedLibraries) {
            let result = await axios.post(`${API_URL}/global-libraries-access`, {
                username,
                changedLibraries,
            }, { withCredentials: true });
            if (result.status === 200) {
                return result.data;
            }
        },
        async getGlobalLibrariesFolders(username) {
            let result = await axios.get(`${API_URL}/global-library-folders`, {
                params: { username },
                withCredentials: true
            });
            if (result.status === 200) {
                this.globalLibraries = result.data;
                
            }
        },  
        async getBookDetails(bookId, libraryId) {
            let result = await axios.get(`${API_URL}/book-details`, {
                params: { bookId, libraryId },
                withCredentials: true
            });
            if (result.status === 200) {
                return result.data;
            }
        },
        async saveLibrary(username, libraryType, name, description, folders) {
            let result = await axios.post(`${API_URL}/save-library`, 
                {
                    username: username,
                    name: name,
                    libraryType: libraryType,
                    description: description,
                    folders: folders,
                },
                {withCredentials: true}
            );
            if (result.status === 200) {
                return result.data;
            }
        },
        async editLibrary(username, libraryType, libraryUUID, name, description, folders) {
            let result = await axios.post(`${API_URL}/edit-library`, 
                {
                    username: username,
                    libraryUUID: libraryUUID,
                    libraryType: libraryType,
                    name: name,
                    description: description,
                    folders: folders,
                },
                {withCredentials: true}
            );
            if (result.status === 200) {
                return result.data;
            }
        },  
        async uploadLibraryCover(libraryUUID, file) {
            const formData = new FormData();
            formData.append('libraryUUID', libraryUUID);
            formData.append('file', file);
            const result = await axios.post(`${API_URL}/upload-cover`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            if (result.status === 200) {
                return result.data;
            }
        },
        async deleteGlobalLibrary(username, libraryUUID) {
            // Use the general /library endpoint (works for both global and user libraries)
            let result = await axios.delete(`${API_URL}/library`, {
                data: {
                    username: username,
                    libraryUUID: libraryUUID,
                },
                withCredentials: true
            });
            if (result.status === 200) {
                return result.data;
            }
        },
        async getFolders(libraryType, path) {
            let result = await axios.post(`${API_URL}/folders`, 
                {
                    folderPath: path,
                    libraryType: libraryType,
                },
                {withCredentials: true}
            );
            if (result.status === 200) {
                return result.data;
            }
        },
        async newFolder(libraryType, usedPath, newFolderName) {
            let result = await axios.post(`${API_URL}/new-folder`,
                {
                    usedPath: usedPath,
                    newFolderName: newFolderName,
                    libraryType: libraryType,
                },
                {withCredentials: true}
            );
            if (result.status === 200) {
                return true;
            }
            return false;
        }
    },
    getters: {

    },
    persist: true
    
})