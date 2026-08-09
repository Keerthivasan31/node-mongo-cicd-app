# Node.js + MongoDB CI/CD Pipeline on Kubernetes

**Project 2** — A two-tier Node.js + MongoDB application deployed on a single-node Kubernetes cluster, orchestrated by Jenkins, packaged with Docker, deployed by Ansible, and monitored by Nagios.

## Architecture

```
Developer push → GitHub webhook → Jenkins → Docker image build
    → Docker Hub push → Ansible playbook → kubectl apply (Kubernetes)
    → Nagios NRPE checks (app health + MongoDB port)
```

## Project Structure

```
node-mongo-cicd-app/
├── server.js                 # Express + Mongoose API (2-tier: app + MongoDB)
├── package.json
├── Dockerfile
├── .dockerignore
├── Jenkinsfile               # CI/CD pipeline
├── ansible/
│   ├── inventory.ini
│   ├── deploy.yml            # Deploys app to K8s AND configures Nagios
│   └── templates/
│       └── nagios_service.cfg.j2
└── k8s/
    ├── namespace.yaml
    ├── secret.yaml           # MONGO_URI
    ├── configmap.yaml        # PORT
    ├── mongo-statefulset.yaml
    ├── mongo-service.yaml    # headless service
    ├── app-deployment.yaml   # 2 replicas
    └── app-service.yaml      # NodePort 30090
```

## Prerequisites (Section 0-7 of the guide)

- 1x AWS EC2 `t3.xlarge` Ubuntu 24.04 LTS, 30 GB gp3 storage
- Security group: 22, 80, 443, 8080, 6443, 30000-32767, 5666
- Tools installed per guide: Git, Docker, Jenkins, Ansible, kubeadm cluster, Nagios Core

## End-to-End Verification Checklist

Run through after deploying:

- [ ] `git log` shows your commits; `git push` triggers Jenkins automatically
- [ ] `docker images` shows the app image; `docker login` succeeded; Docker Hub shows pushed tags
- [ ] Jenkins pipeline shows green (SUCCESS) builds in Build History
- [ ] `ansible-playbook ... --check` runs clean (dry-run); real run shows changed/ok, no failed
- [ ] `kubectl get pods -A` shows all pods Running/Ready; `kubectl get nodes` shows Ready
- [ ] `curl http://<EC2_PUBLIC_IP>:30090/` returns the Node.js JSON response
- [ ] `http://<EC2_PUBLIC_IP>/nagios` shows all hosts/services green, including the Ansible-generated ones (Node-Mongo App HTTP, MongoDB Port Check)
- [ ] Kill a pod (`kubectl delete pod <name> -n nodeapp`) and watch Kubernetes self-heal it, and Nagios briefly flag then clear the check

## Customization Notes

Replace these placeholders before first pipeline run:

| Placeholder | Location |
|---|---|
| `your-dockerhub-username` | `Jenkinsfile` IMAGE_NAME |
| `your-username` | `Jenkinsfile` checkout URL |
| `<DOCKERHUB_USERNAME>` | `k8s/app-deployment.yaml` image |

Jenkins credentials required: `dockerhub-creds` (username/password), `github-ssh` (SSH key), `kubeconfig-cred` (secret file = copy of `/etc/kubernetes/admin.conf`).

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Jenkins can't run `docker build` | `sudo usermod -aG docker jenkins` then `sudo systemctl restart jenkins` |
| `kubeadm init` hangs/fails | Swap not disabled, or containerd cgroup mismatch — confirm `swapoff -a` and `SystemdCgroup = true` |
| Pods stuck Pending | Calico not installed, or control-plane taint not removed (sections 6.4/6.5) |
| `kubectl` connection refused in pipeline | KUBECONFIG not set, or `/home/jenkins-kubeconfig` not readable (chmod 644) |
| Nagios web UI 403/blank | `sudo a2enmod rewrite cgi && sudo systemctl restart apache2` |
| `check_http` CRITICAL but app works | Wrong NodePort in command — check `kubectl get svc` |
| GitHub webhook never fires | Security group 8080 not open to GitHub, or no public IP — use Poll SCM |
| Out of memory / instance freezes | Use t3.xlarge; stop Nagios/Jenkins when idle |

## Optional Extensions

- **Multi-node K8s**: install containerd + kubelet + kubeadm on extra EC2s, then run the saved `kubeadm join` command
- **Helm**: package `k8s/` into a chart; Ansible runs `helm upgrade --install`
- **ECR instead of Docker Hub**: `aws ecr get-login-password | docker login --username AWS --password-stdin ...`
- **Alerting**: configure `contacts.cfg` with SMTP relay or Slack webhook
- **HTTPS**: put Nginx/ALB in front of NodePorts with Let's Encrypt