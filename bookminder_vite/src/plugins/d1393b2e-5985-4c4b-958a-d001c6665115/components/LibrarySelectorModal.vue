<template>
    <div class="library-selector-modal">
        <div class="modal-header">
            <h2>{{ t('gutenberg.select library') }}</h2>
            <button class="close-btn" @click="$emit('close')">&times;</button>
        </div>
        
        <div class="modal-body">
            <p class="book-info">
                <strong>{{ bookTitle }}</strong>
            </p>
            <p class="instruction">{{ t('gutenberg.select library instruction') }}</p>
            
            <div v-if="loading" class="loading">
                {{ t('common.loading') }}...
            </div>
            
            <div v-else-if="error" class="error-message">
                {{ error }}
            </div>
            
            <div v-else class="libraries-list">
                <div 
                    v-for="library in availableLibraries" 
                    :key="library.id"
                    class="library-item"
                    :class="{ 'selected': selectedLibraryId === library.id }"
                    @click="selectedLibraryId = library.id"
                >
                    <div class="library-icon">
                        <font-awesome-icon :icon="library.type === 'global' ? icons.faGlobe : icons.faUser" />
                    </div>
                    <div class="library-info">
                        <div class="library-name">{{ library.name }}</div>
                        <div class="library-type">{{ library.type === 'global' ? t('common.global') : t('common.user') }}</div>
                    </div>
                    <div class="library-check" v-if="selectedLibraryId === library.id">
                        <font-awesome-icon :icon="icons.faCheck" />
                    </div>
                </div>
            </div>
        </div>
        
        <div class="modal-footer">
            <button class="btn-secondary" @click="$emit('close')">{{ t('common.cancel') }}</button>
            <button 
                class="btn-primary" 
                @click="confirmDownload" 
                :disabled="!selectedLibraryId || downloading"
            >
                {{ downloading ? t('gutenberg.downloading') : t('gutenberg.download to library') }}
            </button>
        </div>
    </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faGlobe, faUser, faCheck } from '@fortawesome/free-solid-svg-icons';
import { toastTTS } from '@/utils/tts';

const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default {
    name: 'LibrarySelectorModal',
    components: {
        FontAwesomeIcon
    },
    props: {
        bookId: {
            type: String,
            required: true
        },
        bookTitle: {
            type: String,
            required: true
        }
    },
    emits: ['close', 'download-started'],
    setup(props, { emit }) {
        const { t } = useI18n();
        const availableLibraries = ref([]);
        const selectedLibraryId = ref(null);
        const loading = ref(true);
        const downloading = ref(false);
        const error = ref(null);
        
        const icons = {
            faGlobe,
            faUser,
            faCheck
        };

        const fetchLibraries = async () => {
            try {
                loading.value = true;
                error.value = null;
                
                // Fetch libraries the user has access to with add permission
                const response = await axios.get(`${VITE_BACKEND_URL}/libraries/my-libraries`, {
                    withCredentials: true
                });
                
                // Filter to only include libraries where user has add permission
                availableLibraries.value = response.data.filter(lib => {
                    return lib.add_enabled === 1 || lib.type === 'global';
                });
                
                if (availableLibraries.value.length === 0) {
                    error.value = t('gutenberg.no libraries available');
                }
                
            } catch (err) {
                console.error('Error fetching libraries:', err);
                error.value = t('errors.failed to load libraries');
            } finally {
                loading.value = false;
            }
        };

        const confirmDownload = async () => {
            if (!selectedLibraryId.value || downloading.value) return;
            
            try {
                downloading.value = true;
                
                toastTTS('info', t('gutenberg.download started'));
                
                const response = await axios.post(
                    `${VITE_BACKEND_URL}/plugins/gutenberg/download`,
                    {
                        bookId: props.bookId,
                        libraryId: selectedLibraryId.value
                    },
                    {
                        withCredentials: true
                    }
                );
                
                if (response.data.success) {
                    toastTTS('success', t('gutenberg.download success'));
                    emit('download-started');
                    emit('close');
                } else {
                    toastTTS('error', response.data.error || t('errors.download failed'));
                }
                
            } catch (err) {
                console.error('Error downloading book:', err);
                
                let errorMsg = t('errors.download failed');
                if (err.response?.data?.error) {
                    errorMsg = err.response.data.error;
                } else if (err.response?.status === 403) {
                    errorMsg = t('errors.no permission to add books');
                } else if (err.response?.status === 404) {
                    errorMsg = t('errors.book not found on gutenberg');
                }
                
                toastTTS('error', errorMsg);
            } finally {
                downloading.value = false;
            }
        };

        onMounted(() => {
            fetchLibraries();
        });

        return {
            t,
            icons,
            availableLibraries,
            selectedLibraryId,
            loading,
            downloading,
            error,
            confirmDownload
        };
    }
};
</script>

<style scoped>
.library-selector-modal {
    background: white;
    border-radius: 8px;
    max-width: 500px;
    width: 90vw;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #333;
}

.close-btn {
    background: none;
    border: none;
    font-size: 2rem;
    cursor: pointer;
    color: #666;
    line-height: 1;
    padding: 0;
    width: 2rem;
    height: 2rem;
}

.close-btn:hover {
    color: #333;
}

.modal-body {
    padding: 1.5rem;
    flex: 1;
    overflow-y: auto;
    min-height: 0; /* Important for flexbox scrolling */
}

.book-info {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: #f5f5f5;
    border-radius: 4px;
}

.instruction {
    margin-bottom: 1.5rem;
    color: #666;
}

.loading,
.error-message {
    text-align: center;
    padding: 2rem;
    color: #666;
}

.error-message {
    color: #d32f2f;
}

.libraries-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-height: 300px; /* Limit height for scrolling */
    overflow-y: auto;
    padding-right: 0.5rem; /* Space for scrollbar */
}

.library-item {
    display: flex;
    align-items: center;
    padding: 1rem;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}

.library-item:hover {
    border-color: #2196F3;
    background: #f5f9ff;
}

.library-item.selected {
    border-color: #2196F3;
    background: #e3f2fd;
}

.library-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0f0f0;
    border-radius: 50%;
    margin-right: 1rem;
    font-size: 1.2rem;
    color: #666;
}

.library-item.selected .library-icon {
    background: #2196F3;
    color: white;
}

.library-info {
    flex: 1;
}

.library-name {
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
}

.library-type {
    font-size: 0.875rem;
    color: #666;
}

.library-check {
    color: #2196F3;
    font-size: 1.25rem;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1.5rem;
    border-top: 1px solid #e0e0e0;
}

.btn-secondary,
.btn-primary {
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-secondary {
    background: #f0f0f0;
    color: #333;
}

.btn-secondary:hover {
    background: #e0e0e0;
}

.btn-primary {
    background: #2196F3;
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background: #1976D2;
}

.btn-primary:disabled {
    background: #ccc;
    cursor: not-allowed;
}
</style>
