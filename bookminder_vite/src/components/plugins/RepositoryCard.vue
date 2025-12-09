<template>
    <div class="repository-card row-card">
        <div class="row">
            <div class="open-link-button">
                <font-awesome-icon :icon="icons.open" @click="openUrl()" />
            </div>
            <div class="data-block">
                <h3>{{ name }}</h3>
                <div class="dates">
                    <div class="date-entry">
                        <span>Added:</span>
                        <span>{{ formatTSAsString(added) }}</span>
                    </div>
                    <div>
                        <span>Last checked:</span>
                        <span>{{ getReadableTimeAgoFromTs(lastChecked) }}</span>
                    </div>
                </div>
                <div class="url">{{ url }}</div>
            </div>
            <DeleteWithConfirm :id="id" iconPosition="right" :timeout="5000" @delete="deleteRepository"/>
        </div>
        
    </div>
</template>

<script>

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'

import DeleteWithConfirm from '@/components/actions/DeleteWithConfirm.vue'

import { formatDistanceToNow } from 'date-fns'

export default {
    name: 'RepositoryCard',
    data() {
        return {
            icons: {
                open: faArrowUpRightFromSquare
            }
        }

    },   
    props: {
        id: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        },
        added: {
            type: String,
            required: true
        },
        lastChecked: {
            type: String,
            required: true
        },        
    },
    
    computed: {

    },
    methods: {
        openUrl() {
            if (this.url) {
                window.open(this.url, '_blank');
            }
        },
        deleteRepository() {
            console.log("deleting repository: ", this.id);
        },
        formatTSAsString(ts) {
            ts = ts * 1000;
            const date = new Date(ts);
            return date.toLocaleString();
        },
        getReadableTimeAgoFromTs(ts) {
            ts = ts * 1000;
            const date = new Date(ts);
            return formatDistanceToNow(date, { addSuffix: true });
        },
    },
    async mounted() {

    },    
    components: {
        FontAwesomeIcon,
        DeleteWithConfirm
    }
    
}

</script>


<style scoped>

@import '@/assets/css/buttons.css';

.repository-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
}
.row {
    display: flex;
    align-items: center;
    width: 100%;
}
.data-block {
    display: flex;
    flex-direction: column;
    margin-left: 10px;
    width: 100%;
}

.dates {
    display: flex;
    font-size: 14px;
}

.dates div:not(:last-child) {
    margin-right: 0.7rem;
}

.dates div span:last-child {
    margin-left: 0.25rem;
}

.url {
    font-size: 14px;
}

.open-link-button {
    margin-left: 0.6rem;
    margin-right: 0.6rem;
}

.delete-confirm-button {
    margin-right: 0.7rem;
}
</style>