pipeline {
    agent any
    environment {
        DOCKERHUB_CREDS = credentials('dockerhub-creds')
        IMAGE_NAME = "kvmax/node-mongo-cicd-app"
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-ssh',
                    url: 'git@github.com:Keerthivasan31/node-mongo-cicd-app.git'
            }
        }
        stage('Install & Test') {
            agent { docker { image 'node:20-slim' } }
            steps {
                // Fixed: write npm cache to the local workspace to bypass root permission errors
                sh 'npm install --cache .npm-cache'
                sh 'npm test'
            }
        }
        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest ."
            }
        }
        stage('Push to Docker Hub') {
            steps {
                sh "echo $DOCKERHUB_CREDS_PSW | docker login -u $DOCKERHUB_CREDS_USR --password-stdin"
                sh "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
                sh "docker push ${IMAGE_NAME}:latest"
            }
        }
        stage('Deploy + Configure Monitoring with Ansible') {
            steps {
                withCredentials([file(credentialsId: 'kubeconfig-cred', variable: 'KUBECONFIG_FILE')]) {
                    // Fixed: Removed sudo, copied to workspace, secured permissions, and exported for Ansible
                    sh '''
                        cp $KUBECONFIG_FILE ./jenkins-kubeconfig
                        chmod 600 ./jenkins-kubeconfig
                        export KUBECONFIG=./jenkins-kubeconfig
                        
                        ansible-playbook -i ansible/inventory.ini ansible/deploy.yml \
                            --extra-vars "docker_image=${IMAGE_NAME}:${IMAGE_TAG} workspace_dir=${WORKSPACE}"
                    '''
                }
            }
        }
        stage('Smoke Test') {
            steps {
                sh 'sleep 15 && curl -f http://localhost:30090/health'
            }
        }
    }
    post {
        success { echo "Node+Mongo app deployed and monitoring configured." }
        failure { echo "Pipeline failed - check console output." }
    }
}